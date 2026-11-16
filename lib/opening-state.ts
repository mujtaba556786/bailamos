// One source of truth for the opening date, plus the date and price rules that depend on it.
// Pure functions only, so they can be tested without React or the database.

export const OPENING_DATE = "2026-11-25"; // Berlin date, YYYY-MM-DD

// True while the restaurant has not opened yet (today is before the opening day).
export function isBeforeOpening(today: string, openingDate = OPENING_DATE) {
  return today < openingDate;
}

// The first day a guest may pick in the booking form: the opening day before opening, otherwise today.
export function firstBookableDay(today: string, openingDate = OPENING_DATE) {
  return isBeforeOpening(today, openingDate) ? openingDate : today;
}

// "25. November" / "25 November", without the year.
export function openingDayLabel(locale: "de" | "en", openingDate = OPENING_DATE) {
  const [, month, day] = openingDate.split("-").map(Number);
  const date = new Date(Date.UTC(2026, month - 1, day, 12));
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { day: "numeric", month: "long", timeZone: "UTC" })
    .format(date)
    .replace(/^(\d+)\s/, locale === "de" ? "$1. " : "$1 ");
}

// Prefix used on opening hours and FAQ answers until the opening day.
export function openingHoursPrefix(today: string, locale: "de" | "en", openingDate = OPENING_DATE) {
  if (!isBeforeOpening(today, openingDate)) return "";
  return locale === "en" ? `From ${openingDayLabel("en", openingDate)}: ` : `Ab ${openingDayLabel("de", openingDate)}: `;
}
