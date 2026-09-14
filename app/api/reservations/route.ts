import { env } from 'cloudflare:workers';
import { createBooking } from '../../../lib/booking-service.ts';
import { bookingResponse, readBody } from '../../../lib/booking-http.ts';
import { slot, validateGuests, bookableTablesFor, serviceTimes, onlineMaxGuests } from '../../../lib/booking-policy.ts';
import { getOperations } from '../../../lib/operations-config.ts';
export async function GET(request: Request) {
  return bookingResponse(async () => {
    if (!env.DB) throw new Error('Missing DB');
    const {config}=await getOperations(env.DB),q = new URL(request.url).searchParams;
    const date = q.get('date') || '', time = q.get('time') || '', guests = Number(q.get('guests'));
    validateGuests(guests,config);
    if(!time)return {times:serviceTimes(date,new Date(),config),maxGuests:onlineMaxGuests(config),horizonDays:config.booking.horizonDays};
    const interval = slot(date,time,new Date(),config);
    const rows = await env.DB.prepare(`SELECT DISTINCT table_id FROM reservations WHERE status IN ('pending','confirmed','arrived','seated') AND ((starts_at IS NOT NULL AND starts_at < ? AND ends_at > ?) OR (starts_at IS NULL AND julianday(date || ' ' || time) < julianday(? || ' ' || ?) + ? / 1440.0 AND julianday(? || ' ' || ?) < julianday(date || ' ' || time) + duration_minutes / 1440.0))`).bind(interval.endsAt,interval.startsAt,date,time,(interval.endsAt-interval.startsAt)/60,date,time).all<{table_id:string}>();
    const busy = new Set(rows.results.map(r=>r.table_id));
    const tables=bookableTablesFor(config).filter(t=>t.capacity>=guests && !busy.has(t.id));
    return {tables,tableIds:tables.map(t=>t.id)};
  });
}
export async function POST(request: Request) {
  return bookingResponse(async () => {
    if (!env.DB) throw new Error('Missing DB');
    const {config}=await getOperations(env.DB);
    return createBooking(env.DB,await readBody(request),request.headers.get('Idempotency-Key') || '',new Date(),config);
  });
}
