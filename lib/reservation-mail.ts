import { sendMail, type MailEnv, type MailMessage } from './mail.ts';
export type ReservationMailDetails = { id: string; name: string; email: string; date: string; time: string; guests: number; cancelUrl?: string };
const COLORS = { night: '#0b1712', deep: '#10261e', cream: '#fff8ec', ink: '#171712', gold: '#c68a3b', goldLight: '#d6a45f', red: '#a52520', sand: '#f5e8d3', muted: '#6b6f66' };
const LOGO_URL = 'https://bailamos-waldcafe.de/email-logo.jpg';
const SITE_URL = 'https://bailamos-waldcafe.de';
const ADDRESS = 'Anton-Saefkow-Allee 2A, 14772 Brandenburg an der Havel';
const CONTACT = 'info@bailamos-waldcafe.de';
function germanDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}
function esc(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
}
function rows(r: ReservationMailDetails, de: boolean) {
  return [
    [de ? 'Datum' : 'Date', germanDate(r.date)],
    [de ? 'Uhrzeit' : 'Time', `${r.time} Uhr`],
    [de ? 'Gäste' : 'Guests', String(r.guests)],
    [de ? 'Reservierungsnummer' : 'Reservation number', r.id],
  ];
}
function detailsText(r: ReservationMailDetails, de: boolean) {
  return rows(r, de).map(([label, value]) => `${label}: ${value}`).join('\n');
}
function detailsHtml(r: ReservationMailDetails, de: boolean) {
  const body = rows(r, de).map(([label, value]) => `<tr><td style="padding:8px 0;color:${COLORS.muted};font-size:13px;width:44%;border-bottom:1px solid #eadfcb">${esc(label)}</td><td style="padding:8px 0;color:${COLORS.ink};font-size:15px;font-weight:600;border-bottom:1px solid #eadfcb">${esc(value)}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0 6px">${body}</table>`;
}
function button(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px"><tr><td style="border-radius:999px;background:${COLORS.red}"><a href="${esc(url)}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;
}
function layout(inner: string) {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bailamos Waldcafé</title></head>
<body style="margin:0;padding:0;background:${COLORS.night}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.night};padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:20px;overflow:hidden;background:${COLORS.cream}">
<tr><td align="center" style="background:${COLORS.deep};padding:28px 24px 22px">
<img src="${LOGO_URL}" width="96" height="96" alt="BAILAMOS" style="display:block;border:0;border-radius:50%;width:96px;height:96px">
<div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;color:${COLORS.goldLight};text-transform:uppercase">Waldcafé · Mexikanisch in Brandenburg</div>
</td></tr>
<tr><td style="padding:30px 28px 10px;font-family:Arial,Helvetica,sans-serif;color:${COLORS.ink};font-size:15px;line-height:1.6">${inner}</td></tr>
<tr><td style="padding:18px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:${COLORS.muted};font-size:12px;line-height:1.6;border-top:1px solid #eadfcb">
Bailamos Waldcafé · ${esc(ADDRESS)}<br>${esc(CONTACT)} · <a href="${SITE_URL}" style="color:${COLORS.gold};text-decoration:none">bailamos-waldcafe.de</a>
</td></tr>
</table></td></tr></table>
</body></html>`;
}
function heading(text: string) {
  return `<h1 style="margin:0 0 10px;font-family:Didot,'Bodoni 72',Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;color:${COLORS.deep}">${esc(text)}</h1>`;
}
function divider(label: string) {
  return `<div style="margin:26px 0 4px;padding-top:18px;border-top:1px solid #eadfcb;color:${COLORS.gold};font-size:11px;letter-spacing:2px;text-transform:uppercase">${esc(label)}</div>`;
}
const requestCopy = {
  de: { subject: 'Ihre Reservierungsanfrage bei Bailamos', title: 'Anfrage eingegangen', lead: 'Vielen Dank für Ihre Anfrage. Das Restaurant bestätigt Ihren Tisch in Kürze per E-Mail. Bis dahin ist die Anfrage noch nicht verbindlich.', cancel: 'Falls Sie nicht kommen können, stornieren Sie bitte hier:', button: 'Reservierung stornieren' },
  en: { title: 'Request received', lead: 'Thank you for your request. The restaurant will confirm your table by email shortly. Until then the request is not yet binding.', cancel: 'If you cannot come, you can cancel here:', button: 'Cancel reservation' },
};
export function requestMessage(r: ReservationMailDetails): MailMessage {
  const cancel = r.cancelUrl || '';
  const html = layout([
    `<p style="margin:0 0 4px;color:${COLORS.muted};font-size:13px">Hallo ${esc(r.name)},</p>`,
    heading(requestCopy.de.title),
    `<p style="margin:0 0 6px">${esc(requestCopy.de.lead)}</p>`,
    detailsHtml(r, true),
    `<p style="margin:14px 0 0">${esc(requestCopy.de.cancel)}</p>`,
    button(requestCopy.de.button, cancel),
    divider('English'),
    `<p style="margin:0 0 4px;color:${COLORS.muted};font-size:13px">Hello ${esc(r.name)},</p>`,
    heading(requestCopy.en.title),
    `<p style="margin:0 0 6px">${esc(requestCopy.en.lead)}</p>`,
    detailsHtml(r, false),
    `<p style="margin:14px 0 0">${esc(requestCopy.en.cancel)}</p>`,
    button(requestCopy.en.button, cancel),
  ].join(''));
  const text = [
    `Hallo ${r.name},`, '', requestCopy.de.lead, '', detailsText(r, true), '', requestCopy.de.cancel, cancel, '',
    '---', '',
    `Hello ${r.name},`, '', requestCopy.en.lead, '', detailsText(r, false), '', requestCopy.en.cancel, cancel, '',
    `Bailamos Waldcafé · ${ADDRESS}`,
  ].join('\n');
  return { to: r.email, subject: 'Ihre Reservierungsanfrage bei Bailamos / Your reservation request at Bailamos', text, html };
}
export function confirmedMessage(r: ReservationMailDetails): MailMessage {
  const html = layout([
    `<p style="margin:0 0 4px;color:${COLORS.muted};font-size:13px">Hallo ${esc(r.name)},</p>`,
    heading('Ihre Reservierung ist bestätigt'),
    `<p style="margin:0 0 6px">Wir freuen uns auf Ihren Besuch bei Bailamos.</p>`,
    detailsHtml(r, true),
    `<p style="margin:14px 0 0">Falls Sie nicht kommen können, schreiben Sie uns bitte rechtzeitig an <a href="mailto:${CONTACT}" style="color:${COLORS.gold}">${CONTACT}</a>.</p>`,
    divider('English'),
    `<p style="margin:0 0 4px;color:${COLORS.muted};font-size:13px">Hello ${esc(r.name)},</p>`,
    heading('Your reservation is confirmed'),
    `<p style="margin:0 0 6px">We look forward to welcoming you at Bailamos.</p>`,
    detailsHtml(r, false),
    `<p style="margin:14px 0 0">If you cannot come, please write to us in time at <a href="mailto:${CONTACT}" style="color:${COLORS.gold}">${CONTACT}</a>.</p>`,
  ].join(''));
  const text = [
    `Hallo ${r.name},`, '', 'Ihre Reservierung bei Bailamos ist bestätigt. Wir freuen uns auf Ihren Besuch.', '', detailsText(r, true), '',
    `Falls Sie nicht kommen können, schreiben Sie uns bitte rechtzeitig an ${CONTACT}.`, '', '---', '',
    `Hello ${r.name},`, '', 'Your reservation at Bailamos is confirmed. We look forward to seeing you.', '', detailsText(r, false), '',
    `If you cannot come, please write to us in time at ${CONTACT}.`, '',
    `Bailamos Waldcafé · ${ADDRESS}`,
  ].join('\n');
  return { to: r.email, subject: 'Ihre Reservierung ist bestätigt / Your reservation is confirmed', text, html };
}
export function cancelledMessage(r: ReservationMailDetails): MailMessage {
  const html = layout([
    `<p style="margin:0 0 4px;color:${COLORS.muted};font-size:13px">Hallo ${esc(r.name)},</p>`,
    heading('Ihre Reservierung wurde storniert'),
    `<p style="margin:0 0 6px">Ihre Reservierung bei Bailamos wurde storniert.</p>`,
    detailsHtml(r, true),
    divider('English'),
    `<p style="margin:0 0 4px;color:${COLORS.muted};font-size:13px">Hello ${esc(r.name)},</p>`,
    heading('Your reservation has been cancelled'),
    `<p style="margin:0 0 6px">Your reservation at Bailamos has been cancelled.</p>`,
    detailsHtml(r, false),
  ].join(''));
  const text = [
    `Hallo ${r.name},`, '', 'Ihre Reservierung bei Bailamos wurde storniert.', '', detailsText(r, true), '',
    '---', '',
    `Hello ${r.name},`, '', 'Your reservation at Bailamos has been cancelled.', '', detailsText(r, false), '',
    `Bailamos Waldcafé · ${ADDRESS}`,
  ].join('\n');
  return { to: r.email, subject: 'Ihre Reservierung wurde storniert / Your reservation has been cancelled', text, html };
}
export async function sendReservationMail(env: MailEnv, kind: 'request' | 'confirmed' | 'cancelled', r: ReservationMailDetails) {
  const message = kind === 'request' ? requestMessage(r) : kind === 'confirmed' ? confirmedMessage(r) : cancelledMessage(r);
  try {
    await sendMail(env, message);
    return true;
  } catch (error) {
    console.error('Reservation mail failed', kind, error instanceof Error ? error.message : 'unknown');
    return false;
  }
}
