// Personal booking links (id + token): hashed tokens, old plain tokens, lazy upgrade. Run: npm run test:cancel-tokens
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { getManagedBooking, cancelBooking, digest } from "../lib/booking-service.ts";

const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', d1Databases: ["DB"] });
after(() => mf.dispose());
let ready;
const database = () => (ready ??= (async () => {
  const db = await mf.getD1Database("DB");
  for (const file of (await readdir(new URL("../drizzle/", import.meta.url))).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((value) => value.trim())) await db.prepare(statement).run();
  }
  return db;
})());

const now = new Date("2026-11-13T12:00:00Z");
async function insert(db, id, date, cancelToken, status = "confirmed") {
  const stamp = now.toISOString();
  await db.prepare("INSERT INTO reservations (id,short_code,status,date,time,guest_count,duration_minutes,table_id,customer_name,customer_phone,customer_email,cancel_token,created_at,updated_at,version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)")
    .bind(id, `BLMS-${id}`, status, date, "19:00", 2, 120, "tisch-1", "Test", "+491700000000", "test@example.com", cancelToken, stamp, stamp).run();
}
const stored = async (db, id) => (await db.prepare("SELECT cancel_token FROM reservations WHERE id = ?").bind(id).first()).cancel_token;

test("a hashed token opens the booking; a wrong one does not", async () => {
  const db = await database();
  await insert(db, "r1", "2026-12-01", `sha256:${await digest("secret-1")}`);
  assert.equal((await getManagedBooking(db, "r1", "secret-1", now)).short_code, "BLMS-r1");
  await assert.rejects(getManagedBooking(db, "r1", "wrong", now), { code: "NOT_FOUND" });
  await assert.rejects(getManagedBooking(db, "r1", "", now), { code: "NOT_FOUND" });
  await assert.rejects(getManagedBooking(db, "r1", "x".repeat(129), now), { code: "NOT_FOUND" });
});

test("the stored hash itself is never accepted as a token", async () => {
  const db = await database();
  await assert.rejects(getManagedBooking(db, "r1", await stored(db, "r1"), now), { code: "NOT_FOUND" });
});

test("an old plain token works for a future booking and is replaced by its hash on first use", async () => {
  const db = await database();
  await insert(db, "r2", "2026-11-20", "old-plain-2");
  const row = await getManagedBooking(db, "r2", "old-plain-2", now);
  assert.equal(row.short_code, "BLMS-r2");
  assert.equal(row.cancel_token, undefined);
  assert.equal(await stored(db, "r2"), `sha256:${await digest("old-plain-2")}`);
  // The same link keeps working, now through the hash.
  assert.equal((await getManagedBooking(db, "r2", "old-plain-2", now)).short_code, "BLMS-r2");
});

test("an old plain token for a past booking is refused and left as it is", async () => {
  const db = await database();
  await insert(db, "r3", "2026-11-01", "old-plain-3");
  await assert.rejects(getManagedBooking(db, "r3", "old-plain-3", now), { code: "NOT_FOUND" });
  assert.equal(await stored(db, "r3"), "old-plain-3");
});

test("cancelling through an old link works and upgrades the token", async () => {
  const db = await database();
  await insert(db, "r4", "2026-11-25", "old-plain-4");
  const result = await cancelBooking(db, "r4", "old-plain-4");
  assert.equal(result.status, "cancelled");
  assert.match(await stored(db, "r4"), /^sha256:/);
  assert.equal((await cancelBooking(db, "r4", "old-plain-4")).status, "cancelled");
});
