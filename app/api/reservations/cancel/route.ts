import { env } from 'cloudflare:workers';
import { cancelBooking } from '../../../../lib/booking-service.ts';
import { bookingResponse, readBody } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';
export async function POST(request: Request) {
  return bookingResponse(async () => {
    const b = await readBody(request);
    if (!b || typeof b.id !== 'string' || typeof b.token !== 'string') throw new BookingError(400,'INVALID_REQUEST','Ungültige Anfrage.');
    if (!env.DB) throw new Error('Missing DB');
    return cancelBooking(env.DB,b.id,b.token);
  });
}
