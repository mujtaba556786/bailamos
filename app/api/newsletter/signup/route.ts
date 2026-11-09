import { env } from 'cloudflare:workers';
import { requestNewsletterConfirmation } from '../../../../lib/newsletter.ts';
import { allowSignup } from '../../../../lib/signup-rate-limit.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Always gives the same answer, so the form cannot be used to find out who is subscribed.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { name?: unknown; email?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ ok: false, error: 'Bitte eine gültige E-Mail-Adresse angeben. / Please enter a valid email address.' }, { status: 400 });
  }
  if (!env.DB) throw new Error('Missing DB');
  // Too many sign-ups from one visitor, or for the whole site today, gets a polite refusal.
  if (!await allowSignup(env.DB, request.headers.get('cf-connecting-ip') || '')) {
    return Response.json({ ok: false, error: 'Zu viele Anmeldungen. Bitte versuchen Sie es später noch einmal. / Too many sign-ups. Please try again later.' }, { status: 429 });
  }
  await requestNewsletterConfirmation(env.DB, env, email, name, 'website');
  return Response.json({ ok: true });
}
