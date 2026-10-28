import { env } from 'cloudflare:workers';
import { cancelBooking } from '../../../../lib/booking-service.ts';
import { bookingResponse, readBody } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';
import { sendReservationMail } from '../../../../lib/reservation-mail.ts';
export async function POST(request: Request) {
  return bookingResponse(async () => {
    const b = await readBody(request);
    if (!b || typeof b.id !== 'string' || typeof b.token !== 'string') throw new BookingError(400,'INVALID_REQUEST','Ungültige Anfrage.');
    if (!env.DB) throw new Error('Missing DB');
    const result = await cancelBooking(env.DB,b.id,b.token);
    if ('version' in result) {
      const row = await env.DB.prepare('SELECT customer_name,customer_email,date,time,guest_count FROM reservations WHERE id = ?').bind(b.id).first<Record<string,string|number>>();
      if (row) await sendReservationMail(env,'cancelled',{id:b.id,name:String(row.customer_name),email:String(row.customer_email),date:String(row.date),time:String(row.time),guests:Number(row.guest_count)});
    }
    return result;
  });
}
