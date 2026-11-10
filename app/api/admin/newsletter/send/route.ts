import { requireAdmin } from '../../../../../lib/admin-auth.ts';
import { env } from 'cloudflare:workers';
import { bookingResponse, readBody } from '../../../../../lib/booking-http.ts';
import { BookingError } from '../../../../../lib/booking-policy.ts';
import { countConfirmed, sendCampaignBatch, sendEventTest } from '../../../../../lib/newsletter-send.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function checkKey(request: Request) {
  await requireAdmin(request);
  if (!env.DB) throw new Error('Missing DB');
  return env.DB;
}

// GET: how many confirmed subscribers would receive a campaign.
export async function GET(request: Request) {
  return bookingResponse(async () => {
    const db = await checkKey(request);
    return { confirmed: await countConfirmed(db) };
  });
}

// POST { mode: 'test', to, subject, body } sends one test email.
// POST { mode: 'campaign', campaignId, subject, body } sends the next batch to confirmed subscribers.
export async function POST(request: Request) {
  return bookingResponse(async () => {
    const db = await checkKey(request);
    const b = await readBody(request);
    const subject = typeof b?.subject === 'string' ? b.subject.trim().slice(0, 150) : '';
    const body = typeof b?.body === 'string' ? b.body.trim().slice(0, 10000) : '';
    if (!subject || !body) throw new BookingError(400,'INVALID_REQUEST','Bitte Betreff und Text angeben.');
    if (b?.mode === 'test') {
      const to = typeof b.to === 'string' ? b.to.trim() : '';
      if (!EMAIL_PATTERN.test(to)) throw new BookingError(400,'INVALID_EMAIL','Bitte eine gültige Test-Adresse angeben.');
      // Tests go only to the restaurant inbox or to someone who has confirmed the newsletter,
      // so this form cannot be used to write to anyone else.
      const allowed = to.toLowerCase() === 'info@bailamos-waldcafe.de' || await db.prepare("SELECT 1 FROM newsletter_subscribers WHERE email = ? AND status = 'subscribed'").bind(to.toLowerCase()).first();
      if (!allowed) throw new BookingError(403,'TEST_NOT_ALLOWED','Testmails gehen nur an info@bailamos-waldcafe.de oder an bestätigte Abonnenten.');
      await sendEventTest(env, to, subject, body);
      return { ok: true };
    }
    if (b?.mode === 'campaign') {
      const campaignId = typeof b.campaignId === 'string' ? b.campaignId : '';
      if (!/^EV-[a-f0-9]{16}$/.test(campaignId)) throw new BookingError(400,'INVALID_CAMPAIGN','Ungültige Kampagne.');
      return { ok: true, ...(await sendCampaignBatch(db, env, campaignId, subject, body)) };
    }
    throw new BookingError(400,'INVALID_MODE','Unbekannter Versandmodus.');
  });
}
