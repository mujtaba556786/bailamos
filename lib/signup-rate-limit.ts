import { digest } from './booking-service.ts';

// Counts sign-up requests per hour for each visitor and for the whole site per day.
// Only a hash of the IP address is stored, never the address itself.
const PER_VISITOR_PER_HOUR = 5;
const PER_SITE_PER_DAY = 200;
const HOUR = 3600, DAY = 86400;

async function countAndCheck(db: D1Database, key: string, window: number, limit: number) {
  const row = await db.prepare(`INSERT INTO newsletter_signup_attempts (key, window, count) VALUES (?, ?, 1)
    ON CONFLICT(key, window) DO UPDATE SET count = count + 1 RETURNING count`).bind(key, window).first<{ count: number }>();
  return (row?.count ?? 0) <= limit;
}

// Returns false when the visitor or the whole site has sent too many sign-ups.
export async function allowSignup(db: D1Database, ip: string) {
  const now = Math.floor(Date.now() / 1000);
  const visitor = await digest(`signup:${ip || 'unknown'}`);
  // Old counters are removed so the table stays small.
  await db.prepare('DELETE FROM newsletter_signup_attempts WHERE window < ?').bind(now - 2 * DAY).run();
  const visitorOk = await countAndCheck(db, `visitor:${visitor}`, Math.floor(now / HOUR), PER_VISITOR_PER_HOUR);
  const siteOk = await countAndCheck(db, 'site', Math.floor(now / DAY), PER_SITE_PER_DAY);
  return visitorOk && siteOk;
}
