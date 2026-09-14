import { Miniflare } from 'miniflare';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createBooking, cancelBooking, changeStatus } from '../lib/booking-service.ts';
import { slot, wallTimeToEpoch } from '../lib/booking-policy.ts';
const mf = new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
const now = new Date('2026-09-13T10:00:00Z');
const body = (email, time='19:00', tableId='table-08') => ({date:'2026-09-18',time,guestCount:2,tableId,customer:{name:'Test Guest',phone:'+49123456789',email}});
let passed = 0;
async function test(name, action) {await action(); passed++; console.log(`PASS ${name}`);}
try {
 const db = await mf.getD1Database('DB');
 for (const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()) {
  const sql = await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8');
  for (const statement of sql.split('--> statement-breakpoint').filter(s=>s.trim())) await db.prepare(statement).run();
 }
 let a;
 await test('concurrent exact-table bookings have one winner',async()=>{
  const result = await Promise.allSettled(['one@test.example','two@test.example'].map(email=>createBooking(db,body(email),crypto.randomUUID(),now)));
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(result.find(r=>r.status==='rejected').reason.code,'NO_AVAILABILITY');
  a=result.find(r=>r.status==='fulfilled').value;
 });
 await test('wrong cancellation token rejected',()=>assert.rejects(cancelBooking(db,a.reservation.id,'wrong'),{code:'NOT_FOUND'}));
 await test('cancellation is repeatable and releases table',async()=>{
  await cancelBooking(db,a.reservation.id,a.cancellationToken);
  await cancelBooking(db,a.reservation.id,a.cancellationToken);
  await createBooking(db,body('replacement@test.example'),crypto.randomUUID(),now);
 });
 await test('cancelled booking cannot be resurrected',()=>assert.rejects(changeStatus(db,a.reservation.id,'confirmed',1,'owner'),{code:'INVALID_TRANSITION'}));
 await test('adjacent intervals allowed',()=>createBooking(db,body('adjacent@test.example','21:00'),crypto.randomUUID(),now));
 let retry;
 await test('concurrent retry creates one reservation',async()=>{
  const key=crypto.randomUUID(), b=body('retry@test.example','19:00','table-12');
  const results=await Promise.all([createBooking(db,b,key,now),createBooking(db,b,key,now)]);
  assert.equal(results[0].reservation.id,results[1].reservation.id);
  assert.equal(results[0].cancellationToken,results[1].cancellationToken);
  retry=results[0];
  await assert.rejects(createBooking(db,{...b,notes:'changed'},key,now),{code:'KEY_REUSED'});
 });
 await test('different-key duplicate blocked',()=>assert.rejects(createBooking(db,body('retry@test.example','19:00','restaurant-choice'),crypto.randomUUID(),now),{code:'DUPLICATE_BOOKING'}));
 await test('owner stale update blocked',async()=>{
  await changeStatus(db,retry.reservation.id,'confirmed',0,'owner');
  await assert.rejects(changeStatus(db,retry.reservation.id,'cancelled',0,'owner'),{code:'STALE_VERSION'});
 });
 await test('owner can complete the service lifecycle',async()=>{
  const lifecycle=await createBooking(db,{...body('lifecycle@test.example','21:00','table-08'),date:'2026-09-22'},crypto.randomUUID(),now);
  await changeStatus(db,lifecycle.reservation.id,'confirmed',0,'owner');
  await changeStatus(db,lifecycle.reservation.id,'arrived',1,'owner');
  await changeStatus(db,lifecycle.reservation.id,'seated',2,'owner');
  await changeStatus(db,lifecycle.reservation.id,'completed',3,'owner');
  await assert.rejects(changeStatus(db,lifecycle.reservation.id,'confirmed',4,'owner'),{code:'INVALID_TRANSITION'});
 });
 await test('audit events only for successful changes',async()=>{
  const row=await db.prepare('SELECT count(*) AS n FROM reservation_events WHERE reservation_id=?').bind(retry.reservation.id).first();
  assert.equal(row.n,2);
 });
 await test('invalid calendar, closed day, capacity, email rejected',async()=>{
  for (const delta of [{date:'2026-02-30'},{date:'2026-09-14'},{time:'03:00'},{guestCount:5},{customer:{name:' ',phone:'123',email:'bad'}}]) await assert.rejects(createBooking(db,{...body('invalid@test.example'),...delta},crypto.randomUUID(),now));
 });
 await test('Berlin DST gaps and folds rejected',async()=>{
  assert.throws(()=>wallTimeToEpoch('2026-03-29','02:30'));
  assert.throws(()=>wallTimeToEpoch('2026-10-25','02:30'));
  assert.equal(slot('2026-09-18','23:00',now).endsAt-slot('2026-09-18','23:00',now).startsAt,7200);
 });
 await test('newsletter preserves existing unsubscribe',async()=>{
  await db.prepare("INSERT INTO newsletter_subscribers VALUES ('marketing@test.example','Test','unsubscribed','reservation','old','old','old')").run();
  await createBooking(db,{...body('marketing@test.example','19:00','table-16'),marketingConsent:true},crypto.randomUUID(),now);
  assert.equal((await db.prepare("SELECT status FROM newsletter_subscribers WHERE email='marketing@test.example'").first()).status,'unsubscribed');
 });
 await test('database failure does not poison later requests',async()=>{
  await db.prepare("CREATE TRIGGER test_failure BEFORE INSERT ON reservations BEGIN SELECT RAISE(ABORT,'TEST_FAILURE'); END;").run();
  const b=body('recovery@test.example','21:00','table-12'),key=crypto.randomUUID();
  await assert.rejects(createBooking(db,b,key,now));
  await db.prepare('DROP TRIGGER test_failure').run();
  await createBooking(db,b,key,now);
 });
 await test('newsletter failure leaves booking and consent safely saved',async()=>{
  await db.prepare("CREATE TRIGGER test_marketing_failure BEFORE INSERT ON newsletter_subscribers BEGIN SELECT RAISE(ABORT,'TEST_FAILURE'); END;").run();
  const result=await createBooking(db,{...body('sync@test.example','21:00','table-16'),marketingConsent:true},crypto.randomUUID(),now);
  const row=await db.prepare('SELECT newsletter_opt_in,newsletter_synced_at FROM reservations WHERE id=?').bind(result.reservation.id).first();
  assert.equal(row.newsletter_opt_in,1);assert.equal(row.newsletter_synced_at,null);
  await db.prepare('DROP TRIGGER test_marketing_failure').run();
 });
 await test('legacy records also block overlapping new bookings',async()=>{
  await db.prepare("INSERT INTO reservations (id,status,date,time,guest_count,table_id,customer_name,customer_phone,customer_email,created_at,updated_at) VALUES ('legacy','pending','2026-09-19','19:00',2,'table-08','Legacy','12345678','legacy@test.example','now','now')").run();
  await assert.rejects(createBooking(db,{...body('new@test.example','19:30'),date:'2026-09-19'},crypto.randomUUID(),now),{code:'NO_AVAILABILITY'});
 });
 console.log(`${passed} booking regression checks passed; isolated database disposed.`);
} finally {await mf.dispose();}
