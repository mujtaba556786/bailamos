import { requireAdmin, requireTab } from '../../../../lib/admin-auth.ts';
import { env } from 'cloudflare:workers';
import { changeStatus } from '../../../../lib/booking-service.ts';
import { bookingResponse, readBody } from '../../../../lib/booking-http.ts';
import { BookingError, addDays, berlinDate, validDate } from '../../../../lib/booking-policy.ts';
import { getOperations } from '../../../../lib/operations-config.ts';
import { sendReservationMail, type ReservationMailKind } from '../../../../lib/reservation-mail.ts';
async function database(request: Request) {
  await requireTab(request, 'reservations', 'statistics');
  if (!env.DB) throw new Error('Missing DB');
  return env.DB;
}
// Bookings taken without a fixed table (see createBooking) are labelled 'Ohne Tisch'.
function isNoTable(id: unknown){return String(id).startsWith('open-')||id==='restaurant-choice'}
export async function GET(request: Request) {
  return bookingResponse(async () => {
    const db = await database(request), params = new URL(request.url).searchParams, id = params.get('id');
    if (id) {
      if (id.length > 100) throw new BookingError(400,'INVALID_ID','Ungültige Reservierung.');
      const reservation = await db.prepare('SELECT id,short_code,status,version,date,time,guest_count,table_id,customer_name,customer_phone,customer_email,occasion,dietary,notes,newsletter_opt_in,created_at,updated_at,change_reason FROM reservations WHERE id = ?').bind(id).first();
      if (!reservation) throw new BookingError(404,'NOT_FOUND','Reservierung nicht gefunden.');
      const events = await db.prepare('SELECT previous_status,status,actor,reason,version,created_at FROM reservation_events WHERE reservation_id = ? ORDER BY version DESC').bind(id).all();
      const {config}=await getOperations(db),table=config.tables.find(item=>item.id===String(reservation.table_id));
      return {reservation:{...reservation,table_id:isNoTable(reservation.table_id)?'':reservation.table_id,table_name:table?.name||(isNoTable(reservation.table_id)?'Ohne Tisch':reservation.table_id)},events:events.results};
    }
    if (params.get('pending') === '1') {
      const rows = await db.prepare("SELECT id,short_code,status,version,date,time,guest_count,table_id,customer_name,customer_phone,customer_email,occasion,dietary,notes,created_at,updated_at,change_reason FROM reservations WHERE status = 'pending' AND date >= ? ORDER BY date, time LIMIT 100").bind(berlinDate(new Date())).all();
      const {config}=await getOperations(db),names=new Map(config.tables.map(table=>[table.id,table.name]));
      return {reservations:rows.results.map(row=>({...row,table_id:isNoTable(row.table_id)?'':row.table_id,table_name:names.get(String(row.table_id))||(isNoTable(row.table_id)?'Ohne Tisch':row.table_id)}))};
    }
    const from = params.get('from'), to = params.get('to');
    if (from || to) {
      // A date range for the statistics tab and the list filters; at most one year at a time.
      if (!validDate(from) || !validDate(to) || from > to || to > addDays(from, 366)) throw new BookingError(400,'INVALID_RANGE','Bitte einen gültigen Zeitraum wählen (höchstens ein Jahr).');
      const rows = await db.prepare('SELECT id,short_code,status,version,date,time,guest_count,table_id,customer_name,customer_phone,customer_email,occasion,dietary,notes,created_at,updated_at,change_reason FROM reservations WHERE date BETWEEN ? AND ? ORDER BY date, time LIMIT 1000').bind(from, to).all();
      const {config}=await getOperations(db),names=new Map(config.tables.map(table=>[table.id,table.name]));
      return {reservations:rows.results.map(row=>({...row,table_id:isNoTable(row.table_id)?'':row.table_id,table_name:names.get(String(row.table_id))||(isNoTable(row.table_id)?'Ohne Tisch':row.table_id)}))};
    }
    const date = params.get('date');
    if (!validDate(date)) throw new BookingError(400,'INVALID_DATE','Datum fehlt oder ist ungültig.');
    const rows = await db.prepare('SELECT id,short_code,status,version,date,time,guest_count,table_id,customer_name,customer_phone,customer_email,occasion,dietary,notes,created_at,updated_at,change_reason FROM reservations WHERE date = ? ORDER BY time').bind(date).all();
    const {config}=await getOperations(db),names=new Map(config.tables.map(table=>[table.id,table.name]));
    return {reservations:rows.results.map(row=>({...row,table_id:isNoTable(row.table_id)?'':row.table_id,table_name:names.get(String(row.table_id))||(isNoTable(row.table_id)?'Ohne Tisch':row.table_id)}))};
  });
}
// Loads what a guest mail needs. The restaurant e-mail in the mail text comes from the settings.
async function mailDetails(db: D1Database, id: string, reason = '') {
  const row = await db.prepare('SELECT short_code,customer_name,customer_email,date,time,guest_count FROM reservations WHERE id = ?').bind(id).first<Record<string,string|number>>();
  if (!row) return null;
  const {config} = await getOperations(db);
  return {id,reference:row.short_code?String(row.short_code):undefined,name:String(row.customer_name),email:String(row.customer_email),date:String(row.date),time:String(row.time),guests:Number(row.guest_count),reason,restaurantEmail:config.restaurant.contact.email||undefined};
}
const mailKinds: Record<string, ReservationMailKind> = {confirmed:'confirmed',declined:'declined',cancelled:'restaurant-cancelled'};
// The outcome goes into the booking history ("Verlauf"), so the admin can see whether the guest got the e-mail.
async function recordMail(db: D1Database, id: string, status: string, version: number, sent: boolean, eventId: string) {
  await db.prepare(`INSERT INTO reservation_events (id,reservation_id,previous_status,status,actor,reason,version,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`)
    .bind(eventId,id,status,status,'system',sent ? 'E-Mail gesendet' : 'E-Mail fehlgeschlagen',version,new Date().toISOString()).run();
}
export async function PATCH(request: Request) {
  return bookingResponse(async () => {
    const db = await database(request), b = await readBody(request);
    if (!b || typeof b.id !== 'string' || typeof b.status !== 'string' || !Number.isInteger(b.version) || b.version < 0 || (b.reason !== undefined && typeof b.reason !== 'string') || (b.notifyGuest !== undefined && typeof b.notifyGuest !== 'boolean')) throw new BookingError(400,'INVALID_REQUEST','Bitte Status und aktuelle Version angeben.');
    // The reason is optional (it is shown to the guest in the e-mail); at most 500 characters.
    const reason = (b.reason || '').trim();
    if (reason.length > 500) throw new BookingError(400,'INVALID_REASON','Der Grund darf höchstens 500 Zeichen lang sein.');
    const result = await changeStatus(db,b.id,b.status,b.version,'owner',reason);
    // Only the request that really switched the status sends a mail, so two quick clicks never send twice.
    const kind = mailKinds[b.status];
    const wantsMail = b.status === 'confirmed' || b.notifyGuest !== false;
    if (result.changed && kind && wantsMail) {
      const details = await mailDetails(db,b.id,reason);
      if (details) await recordMail(db,b.id,b.status,result.version,await sendReservationMail(env,kind,details),`${b.id}:mail:${result.version}`);
    }
    return result;
  });
}
// "Erneut senden": sends the mail for the booking's current status again (admin key only, not staff).
export async function POST(request: Request) {
  return bookingResponse(async () => {
    await requireAdmin(request);
    if (!env.DB) throw new Error('Missing DB');
    const b = await readBody(request);
    if (!b || typeof b.id !== 'string' || b.action !== 'resend-mail') throw new BookingError(400,'INVALID_REQUEST','Ungültige Anfrage.');
    const row = await env.DB.prepare('SELECT status,version,change_reason,updated_by FROM reservations WHERE id = ?').bind(b.id).first<{status:string;version:number;change_reason:string;updated_by:string}>();
    if (!row) throw new BookingError(404,'NOT_FOUND','Reservierung nicht gefunden.');
    // A booking the guest cancelled online gets mail 3 again, never the restaurant-cancel mail.
    const kind = row.status === 'cancelled' && row.updated_by === 'customer' ? 'guest-cancelled' : mailKinds[row.status];
    if (!kind) throw new BookingError(409,'NO_MAIL','Für diesen Status gibt es keine E-Mail.');
    const details = await mailDetails(env.DB,b.id,row.change_reason || '');
    if (!details) throw new BookingError(404,'NOT_FOUND','Reservierung nicht gefunden.');
    const sent = await sendReservationMail(env,kind,details);
    await recordMail(env.DB,b.id,row.status,row.version,sent,`${b.id}:mail:${row.version}:${crypto.randomUUID()}`);
    return {ok:true,sent};
  });
}
