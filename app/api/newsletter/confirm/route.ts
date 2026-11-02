import { env } from 'cloudflare:workers';
import { confirmNewsletter, messagePage } from '../../../../lib/newsletter.ts';

// GET only shows a button. Mail scanners open links automatically, so the
// subscription is confirmed only by the POST that the button sends.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  return messagePage('Möchten Sie die Events und Angebote von Bailamos Waldcafé erhalten?', {
    action: `/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
    button: 'Ja, Anmeldung bestätigen',
  });
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const confirmed = env.DB ? await confirmNewsletter(env.DB, token) : false;
  return messagePage(confirmed
    ? 'Danke! Ihre Anmeldung ist bestätigt. Wir informieren Sie über Events und Angebote. / Thank you! Your subscription is confirmed.'
    : 'Dieser Link ist ungültig oder wurde bereits benutzt. / This link is invalid or has already been used.');
}
