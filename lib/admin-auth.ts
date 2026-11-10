import { env } from 'cloudflare:workers';
import { BookingError } from './booking-policy.ts';
import { digest } from './booking-service.ts';

// Every admin API route checks the x-admin-key header through this one function.
// Wrong keys are counted per visitor per hour, so a guessing run is stopped after a few tries.
const MAX_FAILURES_PER_HOUR = 10;
const HOUR = 3600;

// Compares two hex digests in constant time, so the response time does not reveal how much of the key matched.
function sameDigest(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}

export async function requireAdmin(request: Request) {
  const db = env.DB;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = `admin:${await digest(`admin:${ip}`)}`;
  const window = Math.floor(Date.now() / 1000 / HOUR);
  // The limiter fails open: if its table is unavailable, the key check below still decides access.
  if (db) {
    try {
      await db.prepare('DELETE FROM admin_auth_failures WHERE window < ?').bind(window - 48).run();
      const row = await db.prepare('SELECT count FROM admin_auth_failures WHERE key = ? AND window = ?').bind(key, window).first<{ count: number }>();
      if ((row?.count ?? 0) >= MAX_FAILURES_PER_HOUR) throw new BookingError(429, 'TOO_MANY_ATTEMPTS', 'Zu viele Fehlversuche. Bitte später erneut versuchen.');
    } catch (error) {
      if (error instanceof BookingError) throw error;
      console.error('Admin attempt limiter unavailable');
    }
  }
  const expected = env.ADMIN_API_KEY || '';
  const given = request.headers.get('x-admin-key') || '';
  const valid = expected.length > 0 && sameDigest(await digest(given), await digest(expected));
  if (valid) return;
  if (db) {
    await db.prepare(`INSERT INTO admin_auth_failures (key, window, count) VALUES (?, ?, 1)
      ON CONFLICT(key, window) DO UPDATE SET count = count + 1`).bind(key, window).run().catch(() => console.error('Admin attempt limiter unavailable'));
  }
  throw new BookingError(401, 'UNAUTHORIZED', 'Nicht autorisiert.');
}
