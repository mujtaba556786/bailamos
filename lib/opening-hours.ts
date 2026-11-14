// Opening hours as guests read them, grouped: "Di–Do 17:00–23:00 Uhr", "Mo geschlossen".
// Input is the openingHours object from the operations config (data/restaurant.json until the admin saves its own).
import type { Locale } from "./i18n";

export const WEEKDAYS = [
  ["monday", "Mo", "Mon"],
  ["tuesday", "Di", "Tue"],
  ["wednesday", "Mi", "Wed"],
  ["thursday", "Do", "Thu"],
  ["friday", "Fr", "Fri"],
  ["saturday", "Sa", "Sat"],
  ["sunday", "So", "Sun"],
] as const;

export function formatHours(hours: string | undefined, locale: Locale) {
  if (!hours || hours === "closed") return locale === "en" ? "closed" : "geschlossen";
  return hours.replace("-", "–") + (locale === "en" ? "" : " Uhr");
}

// Days next to each other with the same hours share one row.
export function groupedOpeningHours(openingHours: Record<string, string>, locale: Locale) {
  const rows: { days: string; hours: string }[] = [];
  let start = 0;
  for (let i = 1; i <= WEEKDAYS.length; i++) {
    if (i < WEEKDAYS.length && openingHours[WEEKDAYS[i][0]] === openingHours[WEEKDAYS[start][0]]) continue;
    const label = (index: number) => WEEKDAYS[index][locale === "en" ? 2 : 1];
    rows.push({ days: i - 1 === start ? label(start) : `${label(start)}–${label(i - 1)}`, hours: formatHours(openingHours[WEEKDAYS[start][0]], locale) });
    start = i;
  }
  return rows;
}

export function openingHoursSentence(openingHours: Record<string, string>, locale: Locale) {
  return groupedOpeningHours(openingHours, locale).map((row) => `${row.days} ${row.hours}`).join(", ") + ".";
}
