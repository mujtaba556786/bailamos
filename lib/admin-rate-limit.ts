// Limits how often an action (admin publish/upload, public online booking) may run per visitor per hour.
// Like the login limiter, it fails open: if the table is missing, the action still works.
import { BookingError } from "./booking-policy.ts";
import { digest } from "./booking-service.ts";

// booking: each new online booking sends emails and a Telegram alert, so a script must not be able to flood them.
export const ADMIN_LIMITS = { upload: 60, publish: 120, booking: 8 } as const;
export type AdminAction = keyof typeof ADMIN_LIMITS;
const HOUR = 3600;

export async function adminRateLimit(db: D1Database | undefined, request: Request, action: AdminAction, now = Date.now()) {
  if (!db) return;
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = `${action}:${await digest(`${action}:${ip}`)}`;
  const window = Math.floor(now / 1000 / HOUR);
  let count = 0;
  try {
    await db.prepare("DELETE FROM admin_rate_limits WHERE window < ?").bind(window - 2).run();
    const row = await db.prepare(`INSERT INTO admin_rate_limits (key, window, count) VALUES (?, ?, 1)
      ON CONFLICT(key, window) DO UPDATE SET count = count + 1 RETURNING count`).bind(key, window).first<{ count: number }>();
    count = row?.count ?? 0;
  } catch {
    console.error("Admin rate limiter unavailable");
    return;
  }
  if (count > ADMIN_LIMITS[action]) {
    const messages: Record<AdminAction, string> = {
      upload: "Zu viele Uploads in kurzer Zeit. Bitte in einer Stunde erneut versuchen.",
      publish: "Zu viele Veröffentlichungen in kurzer Zeit. Bitte später erneut versuchen.",
      booking: "Zu viele Reservierungen in kurzer Zeit. Bitte rufen Sie uns an. / Too many reservations in a short time. Please call us.",
    };
    throw new BookingError(429, "TOO_MANY_REQUESTS", messages[action]);
  }
}
