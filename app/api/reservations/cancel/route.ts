import { env } from 'cloudflare:workers';
import { cancelBooking } from '../../../../lib/booking-service.ts';
import { bookingResponse, readBody } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';
import { sendReservationMail } from '../../../../lib/reservation-mail.ts';
import { adminRateLimit } from '../../../../lib/admin-rate-limit.ts';
import { getOperations } from '../../../../lib/operations-config.ts';
export async function POST(request: Request) {
  return bookingResponse(async () => {
    const b = await readBody(request);
    if (!b || typeof b.id !== 'string' || typeof b.token !== 'string') throw new BookingError(400,'INVALID_REQUEST','Ungültige Anfrage.');
    if (!env.DB) throw new Error('Missing DB');
    await adminRateLimit(env.DB, request, 'cancel');
    const result = await cancelBooking(env.DB,b.id,b.token);
    // Only the request that really cancelled sends mails (mail 3 to the guest, a short notice to the restaurant); never the restaurant-cancel mail.
    if ('changed' in result && result.changed) {
      const row = await env.DB.prepare('SELECT short_code,customer_name,customer_email,date,time,guest_count FROM reservations WHERE id = ?').bind(b.id).first<Record<string,string|number>>();
      if (row) {
        const {config} = await getOperations(env.DB);
        const details = {id:b.id,reference:row.short_code?String(row.short_code):undefined,name:String(row.customer_name),email:String(row.customer_email),date:String(row.date),time:String(row.time),guests:Number(row.guest_count),restaurantEmail:config.restaurant.contact.email||undefined};
        await sendReservationMail(env,'guest-cancelled',details);
        await sendReservationMail(env,'guest-cancel-notice',details);
      }
    }
    return result;
  });
}
