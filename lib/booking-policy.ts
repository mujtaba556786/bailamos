import restaurant from "../data/restaurant.json" with { type: "json" };
import tables from "../data/tables.json" with { type: "json" };
import type { OperationsConfig } from "./operations-config.ts";

export const TIME_ZONE = "Europe/Berlin";
export const DURATION = restaurant.reservation.durationMinutes;
export const INTERVAL = restaurant.reservation.intervalMinutes;
export const BOOKING_HORIZON_DAYS = 180;
export const LEAD_MINUTES = 30;
export const bookableTables = tables.filter((table) => table.enabled);
export const ONLINE_MAX_GUESTS = Math.min(restaurant.reservation.maximumGuests, Math.max(...bookableTables.map((table) => table.capacity), 0));
const policy=(config?:OperationsConfig)=>({restaurant:config?.restaurant??restaurant,tables:config?.tables??tables,leadMinutes:config?.booking.leadMinutes??LEAD_MINUTES,horizonDays:config?.booking.horizonDays??BOOKING_HORIZON_DAYS});
export const bookableTablesFor=(config?:OperationsConfig)=>policy(config).tables.filter(table=>table.enabled);
export const onlineMaxGuests=(config?:OperationsConfig)=>Math.min(policy(config).restaurant.reservation.maximumGuests,Math.max(...bookableTablesFor(config).map(table=>table.capacity),0));

export class BookingError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;
  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
export function localParts(now: Date) {
  return Object.fromEntries(clock.formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}
export function berlinDate(now = new Date()) {
  const p = localParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export function minuteOfDay(time: string) {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
}
export function validateDate(date: unknown, now = new Date(),config?:OperationsConfig): asserts date is string {
  if (!validDate(date)) throw new BookingError(400, "INVALID_DATE", "Bitte wählen Sie ein gültiges Datum.");
  if (date < berlinDate(now)) throw new BookingError(400, "PAST_DATE", "Bitte wählen Sie einen zukünftigen Termin.");
  const horizon=policy(config).horizonDays;
  if (date > addDays(berlinDate(now), horizon)) throw new BookingError(400, "BOOKING_HORIZON", `Reservierungen sind bis ${horizon} Tage im Voraus möglich.`);
}
export function validateGuests(value: unknown,config?:OperationsConfig): asserts value is number {
  const maximum=policy(config).restaurant.reservation.maximumGuests,maxOnline=onlineMaxGuests(config);
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maximum) {
    throw new BookingError(400, "INVALID_GUESTS", "Bitte prüfen Sie die Gästezahl.");
  }
  if (value > maxOnline) throw new BookingError(422, "GROUP_REQUEST_REQUIRED", `Online können wir aktuell bis zu ${maxOnline} Personen an einem Tisch reservieren. Für größere Gruppen stimmen Sie die Plätze bitte direkt mit dem Restaurant ab.`);
}
const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
export function serviceWindow(date: string,config?:OperationsConfig): [number, number] | null {
  const day = weekdays[new Date(`${date}T12:00:00Z`).getUTCDay()];
  const hours = policy(config).restaurant.openingHours[day];
  if (hours === "closed") return null;
  const [open, close] = hours.split("-").map(minuteOfDay);
  return [open, close <= open ? close + 1440 : close];
}

// Find all UTC instants matching the local wall time. Reject DST gaps/folds instead
// of silently shifting a guest's selection or selecting an arbitrary offset.
export function wallTimeToEpoch(date: string, time: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  const offsets = new Set<number>();
  for (const delta of [-12, 0, 12]) {
    const instant = wall + delta * 3600000;
    const p = localParts(new Date(instant));
    offsets.add(Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`) - instant);
  }
  const candidates = [...offsets].map((offset) => wall - offset).filter((instant) => {
    const p = localParts(new Date(instant));
    return `${p.year}-${p.month}-${p.day}` === date && `${p.hour}:${p.minute}` === time;
  });
  if (candidates.length !== 1) throw new BookingError(400, "AMBIGUOUS_TIME", "Diese Uhrzeit ist wegen der Zeitumstellung nicht eindeutig. Bitte wählen Sie eine andere Uhrzeit.");
  return candidates[0] / 1000;
}

export function slot(date: unknown, time: unknown, now = new Date(),config?:OperationsConfig) {
  validateDate(date, now,config);
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BookingError(400, "INVALID_TIME", "Bitte wählen Sie eine gültige Uhrzeit.");
  const p=policy(config),duration=p.restaurant.reservation.durationMinutes,interval=p.restaurant.reservation.intervalMinutes;
  const window = serviceWindow(date,config);
  if (!window) throw new BookingError(422, "CLOSED", "An diesem Tag haben wir geschlossen. Bitte wählen Sie einen anderen Tag.");
  const start = minuteOfDay(time);
  if (start < window[0] || start + duration > window[1] || (start - window[0]) % interval !== 0) {
    throw new BookingError(422, "OUTSIDE_SERVICE", "Dieser Termin liegt außerhalb unserer reservierbaren Zeiten.");
  }
  const startsAt = wallTimeToEpoch(date, time);
  if (startsAt < now.getTime() / 1000 + p.leadMinutes * 60) throw new BookingError(422, "TOO_SOON", `Bitte wählen Sie einen Termin mit mindestens ${p.leadMinutes} Minuten Vorlauf.`);
  return { date, time, startsAt, endsAt: startsAt + duration * 60 };
}

export function serviceTimes(date: string, now = new Date(),config?:OperationsConfig) {
  const p=policy(config),duration=p.restaurant.reservation.durationMinutes,interval=p.restaurant.reservation.intervalMinutes;
  const window = serviceWindow(date,config);
  if (!window) return [];
  const result: string[] = [];
  for (let minute = window[0]; minute + duration <= window[1] && minute < 1440; minute += interval) {
    const time = `${Math.floor(minute / 60).toString().padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;
    try { slot(date, time, now,config); result.push(time); } catch (error) { if (!(error instanceof BookingError)) throw error; }
  }
  return result;
}

function field(value: unknown, label: string, max: number, optional = false) {
  if (optional && (value === undefined || value === null)) return "";
  if (typeof value !== "string") throw new BookingError(400, "INVALID_DETAILS", `Bitte prüfen Sie ${label}.`);
  const normalized = value.trim().normalize("NFC");
  if ((!optional && normalized.length === 0) || normalized.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(normalized)) {
    throw new BookingError(400, "INVALID_DETAILS", `Bitte prüfen Sie ${label} (maximal ${max} Zeichen).`);
  }
  return normalized;
}
export function parseBooking(body: unknown,config?:OperationsConfig) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new BookingError(400, "INVALID_REQUEST", "Ungültige Reservierungsdaten.");
  const b = body as Record<string, unknown>;
  if (!validDate(b.date) || typeof b.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)) throw new BookingError(400, "INVALID_SLOT", "Bitte prüfen Sie Datum und Uhrzeit.");
  validateGuests(b.guestCount,config);
  const guestCount = b.guestCount;
  const customer = b.customer as Record<string, unknown> | undefined;
  const name = field(customer?.name, "den Namen", 120);
  const email = field(customer?.email, "die E-Mail-Adresse", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BookingError(400, "INVALID_EMAIL", "Bitte geben Sie eine gültige E-Mail-Adresse ein.");
  const phone = field(customer?.phone, "die Telefonnummer", 40).replace(/[\s().-]/g, "");
  if (!/^\+?\d{7,15}$/.test(phone)) throw new BookingError(400, "INVALID_PHONE", "Bitte geben Sie eine gültige Telefonnummer ein.");
  const tableId = b.tableId === undefined ? "restaurant-choice" : field(b.tableId, "den Tisch", 60);
  if (tableId !== "restaurant-choice" && !bookableTablesFor(config).some((table) => table.id === tableId && table.capacity >= guestCount)) throw new BookingError(422, "INVALID_TABLE", "Dieser Tisch passt nicht zur Gästezahl oder ist nicht buchbar.");
  if (b.marketingConsent !== undefined && typeof b.marketingConsent !== "boolean") throw new BookingError(400, "INVALID_CONSENT", "Bitte prüfen Sie die Newsletter-Auswahl.");
  return { date: b.date, time: b.time, guestCount: b.guestCount, tableId, customer: { name, email, phone }, occasion: field(b.occasion, "den Anlass", 120, true), dietary: field(b.dietary, "die Ernährungsangabe", 120, true), notes: field(b.notes, "die Wünsche", 2000, true), marketingConsent: b.marketingConsent === true };
}
export type BookingInput = ReturnType<typeof parseBooking>;
