import { env } from 'cloudflare:workers';
import { requestNewsletterConfirmation } from '../../../../lib/newsletter.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Always gives the same answer, so the form cannot be used to find out who is subscribed.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { name?: unknown; email?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
  if (!name || !EMAIL_PATTERN.test(email)) {
    return Response.json({ ok: false, error: 'Bitte Name und eine gültige E-Mail-Adresse angeben.' }, { status: 400 });
  }
  if (env.DB) await requestNewsletterConfirmation(env.DB, env, email, name, 'website');
  return Response.json({ ok: true });
}
