import { digest } from './booking-service.ts';
import { sendMail, type MailEnv } from './mail.ts';

// Newsletter sign-up is double opt-in: the guest first clicks a link in an email.
const SITE_URL = 'https://bailamos-waldcafe.de';
const TOKEN_PATTERN = /^[a-f0-9]{48}$/;

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function unsubscribeUrl(token: string) {
  return `${SITE_URL}/api/newsletter/unsubscribe?token=${token}`;
}

// Stores a fresh confirmation link and emails it. Someone who is already subscribed is left alone.
export async function requestNewsletterConfirmation(db: D1Database, env: MailEnv, email: string, name: string) {
  const existing = await db.prepare('SELECT status FROM newsletter_subscribers WHERE email = ?').bind(email).first<{ status: string }>();
  if (existing?.status === 'subscribed') return false;
  const token = randomToken(), unsubscribe = randomToken(), stamp = new Date().toISOString();
  await db.prepare(`INSERT INTO newsletter_subscribers (email,name,status,consent_source,consent_at,created_at,updated_at,confirm_token_hash,unsubscribe_token)
    VALUES (?,?,'pending','reservation',?,?,?,?,?)
    ON CONFLICT(email) DO UPDATE SET status = 'pending', confirm_token_hash = excluded.confirm_token_hash,
      unsubscribe_token = COALESCE(newsletter_subscribers.unsubscribe_token, excluded.unsubscribe_token), updated_at = excluded.updated_at`)
    .bind(email, name, stamp, stamp, stamp, await digest(token), unsubscribe).run();
  try {
    await sendMail(env, confirmationMessage(email, `${SITE_URL}/api/newsletter/confirm?token=${token}`));
  } catch {
    console.error('Newsletter confirmation mail failed');
  }
  return true;
}

// Only the stored hash of the confirmation token is kept, and it is used once.
export async function confirmNewsletter(db: D1Database, token: string) {
  if (!TOKEN_PATTERN.test(token)) return false;
  const stamp = new Date().toISOString();
  const result = await db.prepare(`UPDATE newsletter_subscribers SET status = 'subscribed', confirmed_at = ?, confirm_token_hash = NULL, updated_at = ?
    WHERE confirm_token_hash = ? AND status = 'pending'`).bind(stamp, stamp, await digest(token)).run();
  return result.meta.changes > 0;
}

export async function unsubscribeNewsletter(db: D1Database, token: string) {
  if (!TOKEN_PATTERN.test(token)) return false;
  const result = await db.prepare(`UPDATE newsletter_subscribers SET status = 'unsubscribed', confirm_token_hash = NULL, updated_at = ?
    WHERE unsubscribe_token = ? AND status != 'unsubscribed'`).bind(new Date().toISOString(), token).run();
  return result.meta.changes > 0;
}

function confirmationMessage(email: string, confirmUrl: string) {
  const text = [
    'Bitte bestätigen Sie Ihre Anmeldung zu den Events und Angeboten von Bailamos Waldcafé.',
    '',
    `Link: ${confirmUrl}`,
    '',
    'Wenn Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach.',
    '',
    '---',
    '',
    'Please confirm your subscription to Bailamos Waldcafé events and offers.',
    `Link: ${confirmUrl}`,
    'If you did not sign up, you can ignore this email.',
  ].join('\n');
  const html = `<p>Bitte bestätigen Sie Ihre Anmeldung zu den Events und Angeboten von Bailamos Waldcafé.</p><p><a href="${confirmUrl}">Anmeldung bestätigen</a></p><p>Wenn Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach.</p><hr><p>Please confirm your subscription to Bailamos Waldcafé events and offers.</p><p><a href="${confirmUrl}">Confirm subscription</a></p>`;
  return { to: email, subject: 'Bitte bestätigen / Please confirm: Bailamos Waldcafé', text, html };
}

export function esc(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
}

// Small page shown after a confirm or unsubscribe click.
export function messagePage(text: string, form?: { action: string; button: string }) {
  const button = form ? `<form method="post" action="${esc(form.action)}"><button type="submit" style="margin-top:18px;padding:14px 26px;border:0;border-radius:999px;background:#a52520;color:#fff;font-size:16px;cursor:pointer">${esc(form.button)}</button></form>` : '';
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bailamos Waldcafé</title></head><body style="margin:0;padding:40px 20px;background:#fff8ec;color:#10261e;font-family:Arial,Helvetica,sans-serif;text-align:center"><h1 style="font-family:Georgia,serif;font-weight:normal">Bailamos Waldcafé</h1><p style="font-size:17px;line-height:1.6">${esc(text)}</p>${button}<p style="margin-top:28px"><a href="${SITE_URL}" style="color:#a52520">${SITE_URL.replace('https://', '')}</a></p></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
