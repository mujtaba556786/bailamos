import { env } from 'cloudflare:workers';
import { BookingError } from './booking-policy.ts';
import { digest } from './booking-service.ts';
import { getOperations } from './operations-config.ts';
import { ADMIN_TABS, keyMayOpen, type AdminTab } from './admin-tabs.ts';

// Every admin API route checks the x-admin-key header through this file.
// Two keys exist: the admin key (everything) and the staff key (only the tabs the admin allows).
// Wrong keys are counted per visitor per hour, so a guessing run is stopped after a few tries.
const MAX_FAILURES_PER_HOUR = 10;
const HOUR = 3600;

// Compares two hex digests in constant time, so the response time does not reveal how much of the key matched.
function sameDigest(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}

// Returns 'admin' or 'staff' for a valid key; otherwise counts the failure and throws.
async function resolveRole(request: Request): Promise<'admin' | 'staff'> {
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
  const given = await digest(request.headers.get('x-admin-key') || '');
  const adminKey = env.ADMIN_API_KEY || '';
  if (adminKey.length > 0 && sameDigest(given, await digest(adminKey))) return 'admin';
  const staffKey = env.STAFF_ADMIN_KEY || '';
  if (staffKey.length > 0 && sameDigest(given, await digest(staffKey))) return 'staff';
  if (db) {
    await db.prepare(`INSERT INTO admin_auth_failures (key, window, count) VALUES (?, ?, 1)
      ON CONFLICT(key, window) DO UPDATE SET count = count + 1`).bind(key, window).run().catch(() => console.error('Admin attempt limiter unavailable'));
  }
  throw new BookingError(401, 'UNAUTHORIZED', 'Nicht autorisiert.');
}

// Only the admin key passes.
export async function requireAdmin(request: Request) {
  if ((await resolveRole(request)) !== 'admin') throw new BookingError(403, 'FORBIDDEN', 'Diesen Bereich können nur Administratoren öffnen.');
}

// The admin key passes everything; the staff key passes only the tabs ticked in Tische & Einstellungen.
export async function requireTab(request: Request, ...tabs: AdminTab[]) {
  const role = await resolveRole(request);
  if (role === 'admin') return;
  if (!keyMayOpen(role, await staffTabs(), tabs)) throw new BookingError(403, 'FORBIDDEN', 'Dieser Bereich ist für Mitarbeiter nicht freigegeben.');
}

// Used by the admin page to show only the tabs this key may open.
export async function accessFor(request: Request) {
  const role = await resolveRole(request);
  return { role, tabs: role === 'admin' ? [...ADMIN_TABS] : await staffTabs() };
}

async function staffTabs(): Promise<AdminTab[]> {
  const { config } = await getOperations(env.DB);
  return (config.booking.staffTabs ?? []) as AdminTab[];
}
