import { sendMail, type MailEnv } from './mail.ts';
export type ReservationMailDetails = { id: string; name: string; email: string; date: string; time: string; guests: number; cancelUrl?: string };
function germanDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}
function details(r: ReservationMailDetails) {
  return [
    `Datum / Date: ${germanDate(r.date)}`,
    `Uhrzeit / Time: ${r.time}`,
    `Gäste / Guests: ${r.guests}`,
    `Reservierungsnummer / Reservation number: ${r.id}`,
  ].join('\n');
}
const address = 'Anton-Saefkow-Allee 2A, 14772 Brandenburg an der Havel';
export function requestMessage(r: ReservationMailDetails) {
  return {
    to: r.email,
    subject: 'Ihre Reservierungsanfrage bei Bailamos / Your reservation request at Bailamos',
    text: [
      `Hallo ${r.name},`,
      '',
      'vielen Dank für Ihre Anfrage bei Bailamos Waldcafé. Das Restaurant bestätigt Ihre Anfrage in Kürze per E-Mail. Bis dahin ist sie noch nicht verbindlich.',
      '',
      details(r),
      '',
      'Falls Sie nicht kommen können, stornieren Sie bitte hier:',
      r.cancelUrl || '',
      '',
      '---',
      '',
      `Hello ${r.name},`,
      '',
      'thank you for your request at Bailamos Waldcafé. The restaurant will confirm your request by email shortly. Until then it is not yet binding.',
      '',
      details(r),
      '',
      'If you cannot come, please cancel here:',
      r.cancelUrl || '',
      '',
      `Bailamos Waldcafé · ${address}`,
      '',
    ].join('\n'),
  };
}
export function cancelledMessage(r: ReservationMailDetails) {
  return {
    to: r.email,
    subject: 'Ihre Reservierung wurde storniert / Your reservation has been cancelled',
    text: [
      `Hallo ${r.name},`,
      '',
      'Ihre Reservierung bei Bailamos Waldcafé wurde storniert.',
      '',
      details(r),
      '',
      '---',
      '',
      `Hello ${r.name},`,
      '',
      'Your reservation at Bailamos Waldcafé has been cancelled.',
      '',
      details(r),
      '',
      `Bailamos Waldcafé · ${address}`,
      '',
    ].join('\n'),
  };
}
export async function sendReservationMail(env: MailEnv, kind: 'request' | 'cancelled', r: ReservationMailDetails) {
  const message = kind === 'request' ? requestMessage(r) : cancelledMessage(r);
  try {
    await sendMail(env, message);
    return true;
  } catch (error) {
    console.error('Reservation mail failed', kind, error instanceof Error ? error.message : 'unknown');
    return false;
  }
}
