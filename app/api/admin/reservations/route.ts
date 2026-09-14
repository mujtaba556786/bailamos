import { env } from 'cloudflare:workers';
import { changeStatus } from '../../../../lib/booking-service.ts';
import { bookingResponse, readBody } from '../../../../lib/booking-http.ts';
import { BookingError, validDate } from '../../../../lib/booking-policy.ts';
import { getOperations } from '../../../../lib/operations-config.ts';
function database(request: Request) {
  if (!env.ADMIN_API_KEY || request.headers.get('x-admin-key') !== env.ADMIN_API_KEY) throw new BookingError(401,'UNAUTHORIZED','Nicht autorisiert.');
  if (!env.DB) throw new Error('Missing DB');
  return env.DB;
}
export async function GET(request: Request) {
  return bookingResponse(async () => {
    const db = database(request), params = new URL(request.url).searchParams, id = params.get('id');
    if (id) {
      if (id.length > 100) throw new BookingError(400,'INVALID_ID','Ungültige Reservierung.');
      const reservation = await db.prepare('SELECT id,status,version,date,time,guest_count,table_id,customer_name,customer_phone,customer_email,occasion,dietary,notes,newsletter_opt_in,created_at,updated_at,change_reason FROM reservations WHERE id = ?').bind(id).first();
      if (!reservation) throw new BookingError(404,'NOT_FOUND','Reservierung nicht gefunden.');
      const events = await db.prepare('SELECT previous_status,status,actor,reason,version,created_at FROM reservation_events WHERE reservation_id = ? ORDER BY version DESC').bind(id).all();
      const {config}=await getOperations(db),table=config.tables.find(item=>item.id===String(reservation.table_id));
      return {reservation:{...reservation,table_name:table?.name||reservation.table_id},events:events.results};
    }
    const date = params.get('date');
    if (!validDate(date)) throw new BookingError(400,'INVALID_DATE','Datum fehlt oder ist ungültig.');
    const rows = await db.prepare('SELECT id,status,version,date,time,guest_count,table_id,customer_name,customer_phone,customer_email,occasion,dietary,notes,created_at,updated_at,change_reason FROM reservations WHERE date = ? ORDER BY time').bind(date).all();
    const {config}=await getOperations(db),names=new Map(config.tables.map(table=>[table.id,table.name]));
    return {reservations:rows.results.map(row=>({...row,table_name:names.get(String(row.table_id))||row.table_id}))};
  });
}
export async function PATCH(request: Request) {
  return bookingResponse(async () => {
    const db = database(request), b = await readBody(request);
    if (!b || typeof b.id !== 'string' || typeof b.status !== 'string' || !Number.isInteger(b.version) || b.version < 0 || (b.reason !== undefined && typeof b.reason !== 'string')) throw new BookingError(400,'INVALID_REQUEST','Bitte Status und aktuelle Version angeben.');
    const reason = (b.reason || '').trim();
    if (reason.length > 500 || (['declined','cancelled'].includes(b.status) && !reason)) throw new BookingError(400,'INVALID_REASON','Bitte einen kurzen Grund angeben.');
    return changeStatus(db,b.id,b.status,b.version,'owner',reason);
  });
}
