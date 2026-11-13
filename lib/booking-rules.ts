// Booking rules ("Tische & Einstellungen" → Buchungsregeln): text placeholders, checks,
// blocked days with reasons, and the live summary. No React here, so it can be tested on its own.

export const MAX_PLACEHOLDER = "{max}";

// "{max}" in the large-group note becomes the largest group guests can book online.
export function groupNoteText(note: string, max: number) {
  return note.split(MAX_PLACEHOLDER).join(String(max));
}

// Old notes had the number written in ("über 6 Personen", "more than 6 people").
// Replaces that number with {max} once, only where it clearly counts people, so phone numbers stay untouched.
export function migrateGroupNote(note: string, limit: number) {
  if (note.includes(MAX_PLACEHOLDER)) return note;
  const pattern = new RegExp(`(^|[^\\d+])${limit}(?=\\s+(Personen|Person|Gäste|Gästen|people|persons|guests)\\b)`, "g");
  return note.replace(pattern, `$1${MAX_PLACEHOLDER}`);
}

export type ReservationRules = { durationMinutes: number; intervalMinutes: number; maximumGuests: number; guestSelectLimit: number };

// Field errors shown next to the inputs; the server checks the same rules.
export function bookingRuleErrors(rules: ReservationRules) {
  const errors: Partial<Record<keyof ReservationRules, string>> = {};
  if (rules.guestSelectLimit > rules.maximumGuests) errors.guestSelectLimit = `Darf nicht größer sein als „Max. Gäste pro Reservierung“ (${rules.maximumGuests}).`;
  if (rules.intervalMinutes > 0 && rules.durationMinutes % rules.intervalMinutes !== 0) errors.durationMinutes = `Muss durch das Intervall (${rules.intervalMinutes} Min.) teilbar sein.`;
  return errors;
}

// ---------- Blocked days ----------
export type BlockedReasons = Record<string, string>;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function formatGermanDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
}

// Adds a day (or updates its reason). Returns sorted, de-duplicated dates and reasons only for listed days.
export function addBlockedDay(dates: string[], reasons: BlockedReasons, date: string, reason = "") {
  if (!isoDate.test(date) || Number.isNaN(Date.parse(date))) return { dates, reasons, error: "Bitte ein gültiges Datum wählen." };
  const nextDates = [...new Set([...dates, date])].sort();
  const nextReasons = { ...reasons };
  const clean = reason.trim().slice(0, 60);
  if (clean) nextReasons[date] = clean; else delete nextReasons[date];
  return { dates: nextDates, reasons: nextReasons, error: "" };
}

export function removeBlockedDay(dates: string[], reasons: BlockedReasons, date: string) {
  const nextReasons = { ...reasons };
  delete nextReasons[date];
  return { dates: dates.filter((day) => day !== date), reasons: nextReasons };
}

// Chips for the list: sorted by date, past days hidden unless asked for.
export function blockedDayChips(dates: string[], reasons: BlockedReasons, today: string, showPast: boolean) {
  const all = [...new Set(dates)].sort().map((date) => ({ date, reason: reasons[date] ?? "", past: date < today, label: reasons[date] ? `${formatGermanDate(date)} · ${reasons[date]}` : formatGermanDate(date) }));
  return { visible: all.filter((chip) => showPast || !chip.past), pastCount: all.filter((chip) => chip.past).length };
}

// ---------- Live summary ----------
const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const weekdayNames: Record<(typeof weekdays)[number], string> = { sunday: "Sonntag", monday: "Montag", tuesday: "Dienstag", wednesday: "Mittwoch", thursday: "Donnerstag", friday: "Freitag", saturday: "Samstag" };

function addDaysIso(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Start times guests would see on a day: from opening, every interval, as long as the table time still fits before closing.
export function exampleSlots(hours: string, intervalMinutes: number, durationMinutes: number, limit = 3) {
  const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(hours);
  if (!match || intervalMinutes <= 0) return [];
  const open = Number(match[1]) * 60 + Number(match[2]);
  let close = Number(match[3]) * 60 + Number(match[4]);
  if (close <= open) close += 1440;
  const slots: string[] = [];
  for (let start = open; start + durationMinutes <= close && slots.length < limit + 1; start += intervalMinutes) {
    const minutes = start % 1440;
    slots.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  return slots;
}

function durationText(minutes: number) {
  if (minutes % 60 === 0) return `${minutes / 60} Std.`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
  return `${minutes} Min.`;
}

export type SummaryInput = {
  openingHours: Record<string, string>;
  rules: ReservationRules;
  horizonDays: number;
  blockedDates: string[];
  today: string;
};

// One line that tells the admin what guests will experience with the current (unsaved) values.
export function bookingSummary({ openingHours, rules, horizonDays, blockedDates, today }: SummaryInput) {
  // Today's hours if open, otherwise the next open day within a week.
  let dayLabel = "";
  let slots: string[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const date = addDaysIso(today, offset);
    const day = weekdays[new Date(`${date}T12:00:00Z`).getUTCDay()];
    const found = exampleSlots(openingHours[day] ?? "closed", rules.intervalMinutes, rules.durationMinutes);
    if (found.length) { slots = found; dayLabel = offset === 0 ? "" : ` (${weekdayNames[day]})`; break; }
  }
  const online = Math.min(rules.maximumGuests, rules.guestSelectLimit);
  const lastDay = addDaysIso(today, horizonDays);
  const upcomingBlocked = blockedDates.filter((date) => date >= today).length;
  const parts = [
    slots.length ? `Gäste sehen${dayLabel}: ${slots.slice(0, 3).join(", ")}${slots.length > 3 ? " …" : ""}` : "Keine Startzeiten (alle Tage geschlossen)",
    `Tisch ${durationText(rules.durationMinutes)} belegt`,
    `bis ${online} ${online === 1 ? "Person" : "Personen"} online`,
    `buchbar bis ${formatGermanDate(lastDay)}`,
    `${upcomingBlocked} gesperrte${upcomingBlocked === 1 ? "r Tag" : " Tage"}`,
  ];
  return parts.join(" · ");
}

// ---------- Staff permissions ----------
// Only the administrator may change which areas staff can open. A staff key that is allowed into
// "Tische & Einstellungen" must not be able to grant itself more areas, so its incoming list is ignored.
export function staffTabsAfterSave<T extends string>(role: "admin" | "staff", incoming: T[] | undefined, stored: T[]) {
  return role === "admin" ? incoming : stored;
}
