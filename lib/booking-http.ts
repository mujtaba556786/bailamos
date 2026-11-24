import { NextResponse } from 'next/server';
import { BookingError } from './booking-policy.ts';
// Public write endpoints accept only JSON. A plain HTML form from another site cannot send that content type,
// so this blocks cross-site form posts (CSRF-style spam) without needing a token.
export function requireJson(request: Request) {
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new BookingError(415, 'UNSUPPORTED_MEDIA', 'Die Anfrage muss als JSON gesendet werden.');
}
// Honeypot: a hidden field that people never fill in but simple bots do. Any value means "bot".
export function honeypotFilled(body: unknown) {
  return typeof body === 'object' && body !== null && typeof (body as Record<string, unknown>).website === 'string' && ((body as Record<string, unknown>).website as string).trim() !== '';
}
export async function readBody(request: Request, maxLength = 16000) {
  const raw = await request.text();
  if (raw.length > maxLength) throw new BookingError(413,'BODY_TOO_LARGE','Die Anfrage ist zu groß.');
  try { return JSON.parse(raw); } catch { throw new BookingError(400,'INVALID_JSON','Ungültige Anfrage.'); }
}
export async function bookingResponse(action: () => Promise<unknown>) {
  try { return NextResponse.json(await action(),{headers:{'Cache-Control':'no-store'}}); }
  catch (error) {
    if (error instanceof BookingError) return NextResponse.json({error:error.message,code:error.code,...error.details},{status:error.status,headers:{'Cache-Control':'no-store'}});
    console.error('Booking operation failed');
    return NextResponse.json({error:'Der Reservierungsservice ist momentan nicht erreichbar. Bitte versuchen Sie es erneut.',code:'SERVICE_UNAVAILABLE'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
