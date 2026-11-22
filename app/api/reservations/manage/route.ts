import { env } from 'cloudflare:workers';
import { getManagedBooking } from '../../../../lib/booking-service.ts';
import { bookingResponse, readBody } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';
import { adminRateLimit } from '../../../../lib/admin-rate-limit.ts';

// Read-only lookup: the personal link must be verified before returning its reference.
export async function POST(request: Request) {
  return bookingResponse(async () => {
    const body = await readBody(request);
    if (!body || typeof body.id !== 'string' || typeof body.token !== 'string') {
      throw new BookingError(400, 'INVALID_REQUEST', 'Ungültige Anfrage.');
    }
    if (!env.DB) throw new Error('Missing DB');
    // Guessing links is slowed down per visitor; a real guest opens their link a few times at most.
    await adminRateLimit(env.DB, request, 'lookup');
    const row = await getManagedBooking(env.DB, body.id, body.token);
    return { reference: row.short_code || null };
  });
}
