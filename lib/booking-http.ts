import { NextResponse } from 'next/server';
import { BookingError } from './booking-policy.ts';
export async function readBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 16000) throw new BookingError(413,'BODY_TOO_LARGE','Die Anfrage ist zu groß.');
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
