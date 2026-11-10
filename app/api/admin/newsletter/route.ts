import { requireAdmin } from '../../../../lib/admin-auth.ts';
import { env } from 'cloudflare:workers';
import { bookingResponse } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';

// Lists subscribers for the admin. Tokens are never sent to the browser.
export async function GET(request: Request) {
  return bookingResponse(async () => {
    await requireAdmin(request);
    if (!env.DB) throw new Error('Missing DB');
    const rows = await env.DB.prepare('SELECT email,name,status,consent_source,created_at,confirmed_at,updated_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 2000').all();
    // Campaigns that have been sent, newest first, for the E-Mail history.
    const campaigns = await env.DB.prepare('SELECT campaign_id, MAX(subject) AS subject, COUNT(*) AS recipients, MIN(sent_at) AS sent_at FROM newsletter_sends GROUP BY campaign_id ORDER BY MIN(sent_at) DESC LIMIT 50').all();
    return {subscribers: rows.results, campaigns: campaigns.results};
  });
}
