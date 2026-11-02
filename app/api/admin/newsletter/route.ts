import { env } from 'cloudflare:workers';
import { bookingResponse } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';

// Lists subscribers for the admin. Tokens are never sent to the browser.
export async function GET(request: Request) {
  return bookingResponse(async () => {
    if (!env.ADMIN_API_KEY || request.headers.get('x-admin-key') !== env.ADMIN_API_KEY) throw new BookingError(401,'UNAUTHORIZED','Nicht autorisiert.');
    if (!env.DB) throw new Error('Missing DB');
    const rows = await env.DB.prepare('SELECT email,name,status,consent_source,created_at,confirmed_at,updated_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 2000').all();
    return {subscribers: rows.results};
  });
}
