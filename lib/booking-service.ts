import { BookingError, parseBooking, slot, bookableTablesFor } from './booking-policy.ts';
import type { OperationsConfig } from './operations-config.ts';
export async function digest(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
type Row = Record<string, string | number | null>;
export async function createBooking(db: D1Database, body: unknown, key: string, now = new Date(),config?:OperationsConfig) {
  if (!/^[a-zA-Z0-9-]{20,100}$/.test(key)) throw new BookingError(400,'INVALID_KEY','Bitte laden Sie das Formular neu.');
  const b = parseBooking(body,config), keyHash = await digest(key), payloadHash = await digest(JSON.stringify(b));
  async function response(row: Row, replayed: boolean) {
    return {ok:true,replayed,reservation:{id:row.id,status:row.status,date:row.date,time:row.time,tableId:row.table_id,guestCount:row.guest_count},cancellationToken:await digest(`cancel:${key}:${row.id}`),marketingConsent:Boolean(row.newsletter_opt_in)};
  }
  async function replay() {
    const row = await db.prepare('SELECT * FROM reservations WHERE booking_key_hash = ?').bind(keyHash).first<Row>();
    if (!row) return null;
    if (row.booking_payload_hash !== payloadHash) throw new BookingError(409,'KEY_REUSED','Diese Anfrage wurde bereits mit anderen Angaben verwendet.');
    return response(row,true);
  }
  const existing = await replay();
  if (existing) return existing;
  const interval = slot(b.date,b.time,now,config),duration=config?.restaurant.reservation.durationMinutes??120;
  const fingerprint = await digest(JSON.stringify([b.customer.email,b.customer.phone,b.date,b.time,b.guestCount]));
  for (const table of bookableTablesFor(config).filter(t => t.capacity >= b.guestCount && (b.tableId === 'restaurant-choice' || t.id === b.tableId))) {
    const id = `R-${crypto.randomUUID()}`, stamp = now.toISOString(), token = await digest(`cancel:${key}:${id}`);
    try {
      const inserted = await db.prepare(`INSERT INTO reservations (id,status,date,time,guest_count,duration_minutes,table_id,customer_name,customer_phone,customer_email,occasion,dietary,notes,cancel_token,booking_key_hash,booking_payload_hash,duplicate_fingerprint,starts_at,ends_at,updated_by,newsletter_opt_in,newsletter_consent_at,created_at,updated_at)
        SELECT ?,'pending',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'customer',?,?,?,?
        WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE table_id = ? AND status IN ('pending','confirmed','arrived','seated') AND (
          (starts_at IS NOT NULL AND starts_at < ? AND ? < ends_at)
          OR (starts_at IS NULL AND julianday(date || ' ' || time) < julianday(? || ' ' || ?) + ? / 1440.0 AND julianday(? || ' ' || ?) < julianday(date || ' ' || time) + duration_minutes / 1440.0)
        ))`).bind(id,b.date,b.time,b.guestCount,duration,table.id,b.customer.name,b.customer.phone,b.customer.email,b.occasion,b.dietary,b.notes,`sha256:${await digest(token)}`,keyHash,payloadHash,fingerprint,interval.startsAt,interval.endsAt,b.marketingConsent?1:0,b.marketingConsent?stamp:null,stamp,stamp,table.id,interval.endsAt,interval.startsAt,b.date,b.time,duration,b.date,b.time).run();
      if (!inserted.meta.changes) {
        const repeated = await replay();
        if (repeated) return repeated;
        continue;
      }
      await db.prepare(`INSERT INTO reservation_events (id,reservation_id,previous_status,status,actor,reason,version,created_at) VALUES (?,?,NULL,'pending','customer','',0,?)`).bind(`${id}:0`,id,stamp).run();
    } catch (error) {
      const repeated = await replay();
      if (repeated) return repeated;
      if (String(error).includes('duplicate_fingerprint')) throw new BookingError(409,'DUPLICATE_BOOKING','Für diese Kontaktdaten besteht bereits eine Anfrage zu diesem Termin.');
      if (String(error).includes('BOOKING_OVERLAP')) continue;
      throw error;
    }
    // Booking consent is durable even if the marketing sync needs retrying.
    if (b.marketingConsent) {
      try { await db.batch([
        db.prepare(`INSERT INTO newsletter_subscribers (email,name,status,consent_source,consent_at,created_at,updated_at) VALUES (?,?,'pending','reservation',?,?,?) ON CONFLICT(email) DO NOTHING`).bind(b.customer.email,b.customer.name,stamp,stamp,stamp),
        db.prepare('UPDATE reservations SET newsletter_synced_at = ? WHERE id = ?').bind(stamp,id),
      ]); } catch { console.error('Reservation newsletter sync pending'); }
    }
    return response({id,status:'pending',date:b.date,time:b.time,table_id:table.id,guest_count:b.guestCount,newsletter_opt_in:b.marketingConsent?1:0},false);
  }
  throw new BookingError(409,'NO_AVAILABILITY','Für diese Auswahl ist kein Tisch mehr frei. Bitte wählen Sie einen anderen Termin oder Tisch.');
}
export const transitions: Record<string,string[]> = {pending:['confirmed','declined','cancelled'],confirmed:['arrived','cancelled','no_show'],arrived:['seated','cancelled','no_show'],seated:['completed'],declined:[],cancelled:[],completed:[],no_show:[]};
export async function changeStatus(db: D1Database,id: string,status: string,version: number,actor: string,reason = '') {
  const row = await db.prepare('SELECT status,version FROM reservations WHERE id = ?').bind(id).first<Row>();
  if (!row) throw new BookingError(404,'NOT_FOUND','Reservierung nicht gefunden.');
  if (row.version !== version) throw new BookingError(409,'STALE_VERSION','Die Reservierung wurde inzwischen geändert. Bitte aktualisieren.');
  if (row.status === status) return {ok:true,status,version};
  if (!transitions[String(row.status)]?.includes(status)) throw new BookingError(409,'INVALID_TRANSITION','Dieser Statuswechsel ist nicht möglich.');
  let result;
  try {
    result = await db.prepare('UPDATE reservations SET status = ?,version = version + 1,updated_by = ?,change_reason = ?,updated_at = ? WHERE id = ? AND version = ?').bind(status,actor,reason,new Date().toISOString(),id,version).run();
  } catch (error) {
    if (String(error).includes('BOOKING_OVERLAP')) throw new BookingError(409,'TABLE_CONFLICT','Dieser Tisch wurde inzwischen für den Zeitraum vergeben. Bitte prüfen Sie die Reservierung.');
    throw error;
  }
  if (!result.meta.changes) throw new BookingError(409,'STALE_VERSION','Die Reservierung wurde inzwischen geändert. Bitte aktualisieren.');
  await db.prepare(`INSERT INTO reservation_events (id,reservation_id,previous_status,status,actor,reason,version,created_at) VALUES (?,?,?,?,?,?,?,?)`).bind(`${id}:${version+1}`,id,String(row.status),status,actor,reason,version+1,new Date().toISOString()).run();
  return {ok:true,status,version:version+1};
}
export async function cancelBooking(db: D1Database,id: string,token: string) {
  if (!token || token.length > 128 || token.startsWith('sha256:')) throw new BookingError(404,'NOT_FOUND','Reservierung nicht gefunden.');
  const row = await db.prepare('SELECT status,version FROM reservations WHERE id = ? AND (cancel_token = ? OR cancel_token = ?)').bind(id,`sha256:${await digest(token)}`,token).first<Row>();
  if (!row) throw new BookingError(404,'NOT_FOUND','Reservierung nicht gefunden.');
  if (row.status === 'cancelled') return {ok:true,status:'cancelled'};
  if (!['pending','confirmed'].includes(String(row.status))) throw new BookingError(409,'CANNOT_CANCEL','Diese Reservierung kann nicht mehr online storniert werden.');
  return changeStatus(db,id,'cancelled',Number(row.version),'customer','Online-Stornierung');
}
