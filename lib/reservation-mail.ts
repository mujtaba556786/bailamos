import { sendMail, type MailEnv, type MailMessage } from './mail.ts';
export type ReservationMailDetails = { id: string; reference?: string; name: string; email: string; phone?: string; date: string; time: string; guests: number; cancelUrl?: string; reason?: string; restaurantEmail?: string };
export const RESTAURANT_PHONE = '+49 179 6881793';
const COLORS = { night: '#0b1712', deep: '#10261e', cream: '#fff8ec', ink: '#171712', gold: '#c68a3b', goldLight: '#d6a45f', red: '#a52520', sand: '#f5e8d3', muted: '#6b6f66' };
const LOGO_URL = 'https://bailamos-waldcafe.de/email-logo.jpg';
const SITE_URL = 'https://bailamos-waldcafe.de';
const ADDRESS = 'Anton-Saefkow-Allee 2A, 14772 Brandenburg an der Havel';
const CONTACT = 'info@bailamos-waldcafe.de';
function germanDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}
export function esc(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
}
function rows(r: ReservationMailDetails, de: boolean) {
  return [
    [de ? 'Datum' : 'Date', germanDate(r.date)],
    [de ? 'Uhrzeit' : 'Time', `${r.time} Uhr`],
    [de ? 'Gäste' : 'Guests', String(r.guests)],
    [de ? 'Reservierungsnummer' : 'Reservation number', r.reference || r.id],
  ];
}
function detailsText(r: ReservationMailDetails, de: boolean) {
  return rows(r, de).map(([label, value]) => `${label}: ${value}`).join('\n');
}
function detailsHtml(r: ReservationMailDetails, de: boolean) {
  const body = rows(r, de).map(([label, value]) => `<tr><td style="padding:8px 0;color:${COLORS.muted};font-size:13px;width:44%;border-bottom:1px solid #eadfcb">${esc(label)}</td><td style="padding:8px 0;color:${COLORS.ink};font-size:15px;font-weight:600;border-bottom:1px solid #eadfcb">${esc(value)}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0 6px">${body}</table>`;
}
export function button(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px"><tr><td style="border-radius:999px;background:${COLORS.red}"><a href="${esc(url)}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;
}
export function layout(inner: string) {
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
export function heading(text: string) {
  return `<h1 style="margin:0 0 10px;font-family:Didot,'Bodoni 72',Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;color:${COLORS.deep}">${esc(text)}</h1>`;
}
function divider(label: string) {
  return `<div style="margin:26px 0 4px;padding-top:18px;border-top:1px solid #eadfcb;color:${COLORS.gold};font-size:11px;letter-spacing:2px;text-transform:uppercase">${esc(label)}</div>`;
}
const requestCopy = {
  de: { subject: 'Ihre Reservierungsanfrage bei Bailamos', title: 'Anfrage eingegangen', lead: 'Vielen Dank für Ihre Anfrage. Das Restaurant bestätigt Ihre Reservierung in Kürze per E-Mail. Bis dahin ist die Anfrage noch nicht verbindlich.', cancel: 'Falls Sie nicht kommen können, stornieren Sie bitte hier:', button: 'Reservierung stornieren' },
  en: { title: 'Request received', lead: 'Thank you for your request. The restaurant will confirm your reservation by email shortly. Until then the request is not yet binding.', cancel: 'If you cannot come, you can cancel here:', button: 'Cancel reservation' },
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
// ---- Guest mails for decline, restaurant cancellation and guest cancellation (German first, then English) ----
// No table is ever mentioned: bookings are by date, time and guests only. Every placeholder is HTML-escaped.
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function englishDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${Number(day)} ${MONTHS_EN[Number(month) - 1]} ${year}`;
}
function tableHtml(list: string[][]) {
  const body = list.map(([label, value]) => `<tr><td style="padding:8px 0;color:${COLORS.muted};font-size:13px;width:44%;border-bottom:1px solid #eadfcb">${esc(label)}</td><td style="padding:8px 0;color:${COLORS.ink};font-size:15px;font-weight:600;border-bottom:1px solid #eadfcb">${esc(value)}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0 6px">${body}</table>`;
}
type Language = { greeting: string; paragraphs: string[]; rows: string[][]; after: string[]; closing: string[] };
function languageHtml(l: Language) {
  return [
    `<p style="margin:0 0 10px">${esc(l.greeting)}</p>`,
    ...l.paragraphs.map(text => `<p style="margin:0 0 6px">${esc(text)}</p>`),
    tableHtml(l.rows),
    ...l.after.map(text => `<p style="margin:14px 0 0">${esc(text)}</p>`),
    ...l.closing.map((text, index) => `<p style="margin:${index === 0 ? 18 : 0}px 0 0">${esc(text)}</p>`),
  ].join('');
}
function languageText(l: Language) {
  return [l.greeting, '', ...l.paragraphs, '', ...l.rows.map(([label, value]) => `${label}: ${value}`), '', ...l.after.flatMap(text => [text, '']), ...l.closing].join('\n');
}
function bilingual(to: string, subject: string, de: Language, en: Language): MailMessage {
  const html = layout([languageHtml(de), divider('English'), languageHtml(en)].join(''));
  return { to, subject, text: [languageText(de), '', '---', '', languageText(en), '', `Bailamos Waldcafé · ${ADDRESS}`].join('\n'), html };
}
function guestRows(r: ReservationMailDetails, reason: string) {
  const reference = r.reference || r.id;
  return {
    de: [['Datum', germanDate(r.date)], ['Uhrzeit', `${r.time} Uhr`], ['Personen', String(r.guests)], ['Buchungsnummer', reference], ...(reason ? [['Grund', reason]] : [])],
    en: [['Date', englishDate(r.date)], ['Time', r.time], ['Guests', String(r.guests)], ['Reference', reference], ...(reason ? [['Reason', reason]] : [])],
  };
}
// Mail 1 (restaurant cancels) and mail 2 (restaurant declines a request). The admin note is the reason; no note, no reason line.
export function restaurantDecisionMessage(r: ReservationMailDetails, decision: 'declined' | 'cancelled'): MailMessage {
  const reason = (r.reason || '').trim();
  const reference = r.reference || r.id;
  const email = r.restaurantEmail || CONTACT;
  const rowsFor = guestRows(r, reason);
  if (decision === 'cancelled') {
    return bilingual(r.email, `Absage Ihrer Reservierung im Bailamos Waldcafé / Your reservation has been cancelled – ${reference}`,
      { greeting: `Guten Tag ${r.name},`, paragraphs: ['leider müssen wir Ihre Reservierung im Bailamos Waldcafé absagen. Das tut uns sehr leid.'], rows: rowsFor.de,
        after: [`Gern finden wir gemeinsam einen anderen Termin. Buchen Sie einfach online neu oder melden Sie sich bei uns unter ${RESTAURANT_PHONE} oder ${email}.`, 'Wir bitten um Ihr Verständnis und hoffen, Sie bald bei uns begrüßen zu dürfen.'], closing: ['Herzliche Grüße', 'Ihr Team vom Bailamos Waldcafé'] },
      { greeting: `Hello ${r.name},`, paragraphs: ['Unfortunately, we have to cancel your reservation at Bailamos Waldcafé. We are very sorry about this.'], rows: rowsFor.en,
        after: [`We would be happy to find another date with you. Simply book again online or contact us at ${RESTAURANT_PHONE} or ${email}.`, 'Thank you for your understanding. We hope to welcome you soon.'], closing: ['Kind regards', 'Your Bailamos Waldcafé team'] });
  }
  return bilingual(r.email, `Ihre Reservierungsanfrage im Bailamos Waldcafé / Your reservation request – ${reference}`,
    { greeting: `Guten Tag ${r.name},`, paragraphs: ['vielen Dank für Ihre Anfrage. Leider können wir Ihre Reservierung zum gewünschten Termin nicht bestätigen.'], rows: rowsFor.de,
      after: [`Vielleicht passt ein anderer Termin? Buchen Sie gern online neu oder melden Sie sich bei uns unter ${RESTAURANT_PHONE} oder ${email}.`], closing: ['Herzliche Grüße', 'Ihr Team vom Bailamos Waldcafé'] },
    { greeting: `Hello ${r.name},`, paragraphs: ['Thank you for your request. Unfortunately, we cannot confirm your reservation for the requested time.'], rows: rowsFor.en,
      after: [`Perhaps another date works for you? Feel free to book again online or contact us at ${RESTAURANT_PHONE} or ${email}.`], closing: ['Kind regards', 'Your Bailamos Waldcafé team'] });
}
// Mail 3: the guest cancelled online. Never carries a reason.
export function guestCancelledMessage(r: ReservationMailDetails): MailMessage {
  const reference = r.reference || r.id;
  const email = r.restaurantEmail || CONTACT;
  const rowsFor = guestRows(r, '');
  return bilingual(r.email, `Stornierung bestätigt / Cancellation confirmed – ${reference}`,
    { greeting: `Guten Tag ${r.name},`, paragraphs: ['hiermit bestätigen wir die Stornierung Ihrer Reservierung im Bailamos Waldcafé.'], rows: rowsFor.de,
      after: [`Schade, dass es diesmal nicht klappt. Wir freuen uns, wenn Sie bald einen neuen Termin buchen. Bei Fragen erreichen Sie uns unter ${RESTAURANT_PHONE} oder ${email}.`], closing: ['Herzliche Grüße', 'Ihr Team vom Bailamos Waldcafé'] },
    { greeting: `Hello ${r.name},`, paragraphs: ['We confirm that your reservation at Bailamos Waldcafé has been cancelled.'], rows: rowsFor.en,
      after: [`We are sorry it didn't work out this time and would be glad to welcome you on another day. If you have any questions, contact us at ${RESTAURANT_PHONE} or ${email}.`], closing: ['Kind regards', 'Your Bailamos Waldcafé team'] });
}
// Short internal notice to the restaurant when a guest cancels online.
export function guestCancelNoticeMessage(r: ReservationMailDetails): MailMessage {
  const text = `Gast hat storniert: ${germanDate(r.date)} ${r.time}, ${r.guests} Gäste, ${r.reference || r.id}`;
  const html = layout([heading('Gast hat storniert'), `<p style="margin:0 0 6px;font-size:16px"><strong>${esc(text)}</strong></p>`, `<p style="margin:0 0 6px">${esc(r.name)}</p>`].join(''));
  return { to: r.restaurantEmail || CONTACT, subject: text, text: `${text}\n${r.name}`, html };
}
export function ownerRequestMessage(r: ReservationMailDetails): MailMessage {
  // Opens the admin straight at this booking (after sign-in).
  const adminUrl = `${SITE_URL}/admin?reservation=${encodeURIComponent(r.id)}`;
  const summary = `${germanDate(r.date)} · ${r.time} Uhr · ${r.guests} Gäste`;
  const contact = [r.phone, r.email].filter(Boolean).join(' · ');
  const html = layout([
    heading('Neue Reservierungsanfrage'),
    `<p style="margin:0 0 6px;font-size:16px"><strong>${esc(summary)}</strong></p>`,
    `<p style="margin:0 0 6px">${esc(r.name)}</p>`,
    `<p style="margin:0 0 6px;color:${COLORS.muted}">${esc(contact)}</p>`,
    `<p style="margin:14px 0 0">Bitte im Admin bestätigen oder ablehnen.</p>`,
    button('Im Admin öffnen', adminUrl),
  ].join(''));
  const text = [`Neue Reservierungsanfrage`, '', summary, r.name, contact, '', `Im Admin öffnen: ${adminUrl}`].join('\n');
  return { to: CONTACT, subject: `Neue Anfrage: ${summary} · ${r.name}`, text, html };
}
export type ReservationMailKind = 'request' | 'confirmed' | 'owner' | 'declined' | 'restaurant-cancelled' | 'guest-cancelled' | 'guest-cancel-notice';
export async function sendReservationMail(env: MailEnv, kind: ReservationMailKind, r: ReservationMailDetails) {
  const message = kind === 'request' ? requestMessage(r) : kind === 'confirmed' ? confirmedMessage(r) : kind === 'owner' ? ownerRequestMessage(r) : kind === 'declined' ? restaurantDecisionMessage(r, 'declined') : kind === 'restaurant-cancelled' ? restaurantDecisionMessage(r, 'cancelled') : kind === 'guest-cancel-notice' ? guestCancelNoticeMessage(r) : guestCancelledMessage(r);
  try {
    await sendMail(env, message);
    return true;
  } catch (error) {
    console.error('Reservation mail failed', kind, error instanceof Error ? error.message : 'unknown');
    return false;
  }
}
