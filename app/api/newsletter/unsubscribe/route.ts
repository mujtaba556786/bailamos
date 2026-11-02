import { env } from 'cloudflare:workers';
import { messagePage, unsubscribeNewsletter } from '../../../../lib/newsletter.ts';

// Same two-step as confirm: the link opens a button, and the POST unsubscribes.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  return messagePage('Möchten Sie sich von den Events und Angeboten abmelden?', {
    action: `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
    button: 'Abmelden / Unsubscribe',
  });
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const done = env.DB ? await unsubscribeNewsletter(env.DB, token) : false;
  return messagePage(done
    ? 'Sie sind abgemeldet. / You have been unsubscribed.'
    : 'Dieser Link ist ungültig oder die Abmeldung wurde bereits erledigt. / This link is invalid or the unsubscribe was already done.');
}
