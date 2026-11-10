import { sendMail, type MailEnv, type MailMessage } from './mail.ts';
import { button, esc, heading, layout } from './reservation-mail.ts';

// Event emails to confirmed subscribers. Each campaign is sent in small batches, and every
// send is recorded so a repeated click never mails the same person twice.
const SITE_URL = 'https://bailamos-waldcafe.de';
const BATCH_SIZE = 20;

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
}

function eventMessage(to: string, subject: string, body: string, unsubscribeUrl: string): MailMessage {
  const paragraphs = body.split(/\n{2,}/).map(part => `<p style="margin:0 0 14px">${esc(part.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  const html = layout(`${heading(subject)}${paragraphs}${button('Zur Website / Visit the website', SITE_URL)}<p style="margin:24px 0 0;font-size:12px;color:#6b6f66">Sie erhalten diese E-Mail, weil Sie sich für Events und Angebote angemeldet haben. <a href="${esc(unsubscribeUrl)}" style="color:#a52520">Abmelden / Unsubscribe</a></p>`);
  const text = `${subject}\n\n${body}\n\n---\nAbmelden / Unsubscribe: ${unsubscribeUrl}`;
  return { to, subject, text, html };
}

// Sends a single test email, for example to info@ before a real send.
export async function sendEventTest(env: MailEnv, to: string, subject: string, body: string) {
  await sendMail(env, eventMessage(to, `[TEST] ${subject}`, body, `${SITE_URL}/api/newsletter/unsubscribe?token=test`));
}

// Sends the next batch of a campaign. Returns how many were sent and how many are still waiting.
export async function sendCampaignBatch(db: D1Database, env: MailEnv, campaignId: string, subject: string, body: string) {
  const pending = await db.prepare(`SELECT email, name, unsubscribe_token FROM newsletter_subscribers
    WHERE status = 'subscribed' AND email NOT IN (SELECT email FROM newsletter_sends WHERE campaign_id = ?)
    ORDER BY email LIMIT ?`).bind(campaignId, BATCH_SIZE).all<{ email: string; name: string; unsubscribe_token: string | null }>();
  let sent = 0, failed = 0;
  for (const subscriber of pending.results) {
    let token = subscriber.unsubscribe_token;
    if (!token) {
      token = randomToken();
      await db.prepare('UPDATE newsletter_subscribers SET unsubscribe_token = ? WHERE email = ?').bind(token, subscriber.email).run();
    }
    try {
      await sendMail(env, eventMessage(subscriber.email, subject, body, `${SITE_URL}/api/newsletter/unsubscribe?token=${token}`));
      await db.prepare('INSERT INTO newsletter_sends (campaign_id, email, sent_at, subject) VALUES (?, ?, ?, ?)').bind(campaignId, subscriber.email, new Date().toISOString(), subject).run();
      sent += 1;
    } catch {
      failed += 1;
      console.error('Event email failed for one subscriber');
    }
  }
  const left = await db.prepare(`SELECT COUNT(*) AS n FROM newsletter_subscribers
    WHERE status = 'subscribed' AND email NOT IN (SELECT email FROM newsletter_sends WHERE campaign_id = ?)`).bind(campaignId).first<{ n: number }>();
  return { sent, failed, remaining: left?.n ?? 0 };
}

export function newCampaignId() {
  return `EV-${randomToken().slice(0, 16)}`;
}

// Used by the admin to show how many people a campaign would reach.
export async function countConfirmed(db: D1Database) {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE status = 'subscribed'").first<{ n: number }>();
  return row?.n ?? 0;
}
