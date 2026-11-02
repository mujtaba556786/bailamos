// Posts a new booking request to a Telegram group, with a button that opens it in the admin.
export type TelegramEnv = { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string };
export type BookingAlert = { id: string; reference?: string; name: string; phone: string; date: string; time: string; guests: number };
const SITE_URL = 'https://bailamos-waldcafe.de';

export async function sendTelegramAlert(env: TelegramEnv, booking: BookingAlert) {
  // Without both secrets the alert is simply skipped, so bookings still work.
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const [year, month, day] = booking.date.split('-');
  const text = [
    'Neue Reservierungsanfrage',
    `${day}.${month}.${year} · ${booking.time} Uhr · ${booking.guests} Gäste`,
    booking.name,
    booking.phone,
    booking.reference ? `Nummer: ${booking.reference}` : '',
  ].filter(Boolean).join('\n');
  try {
    // The bot token is part of the URL, so errors are logged without the URL.
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: 'Im Admin öffnen', url: `${SITE_URL}/admin?reservation=${encodeURIComponent(booking.id)}` }]] },
      }),
    });
    if (!response.ok) {
      // Telegram's reply says why (for example, the bot is not in the chat). It never contains the token.
      const reason = await response.text();
      console.error('Telegram alert failed', response.status, reason.slice(0, 300));
      return false;
    }
    return true;
  } catch {
    console.error('Telegram alert failed');
    return false;
  }
}
