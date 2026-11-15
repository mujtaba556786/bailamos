// Display helpers for the admin "Reservierungen" tab: labels, badge colours, date and "vor X Min." texts, filter chips.
// Pure functions without React, so they can be tested on their own. No data fetching or status logic here.

export type ReservationStatus = "pending" | "confirmed" | "declined" | "cancelled" | "arrived" | "seated" | "completed" | "no_show";

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  declined: "Abgelehnt",
  cancelled: "Storniert",
  arrived: "Angekommen",
  seated: "Platziert",
  completed: "Abgeschlossen",
  no_show: "Nicht erschienen",
};

// Text and background colour per status. Every pair has at least 4.5:1 contrast (checked in the tests).
// `className` repeats the same hex values, written out in full so Tailwind finds them.
export const STATUS_TONES: Record<ReservationStatus, { text: string; background: string; className: string }> = {
  pending: { text: "#92400E", background: "#FEF3C7", className: "bg-[#FEF3C7] text-[#92400E]" },
  confirmed: { text: "#065F46", background: "#D1FAE5", className: "bg-[#D1FAE5] text-[#065F46]" },
  arrived: { text: "#1E40AF", background: "#DBEAFE", className: "bg-[#DBEAFE] text-[#1E40AF]" },
  seated: { text: "#3730A3", background: "#E0E7FF", className: "bg-[#E0E7FF] text-[#3730A3]" },
  completed: { text: "#374151", background: "#E5E7EB", className: "bg-[#E5E7EB] text-[#374151]" },
  cancelled: { text: "#991B1B", background: "#FEE2E2", className: "bg-[#FEE2E2] text-[#991B1B]" },
  declined: { text: "#9D174D", background: "#FCE7F3", className: "bg-[#FCE7F3] text-[#9D174D]" },
  no_show: { text: "#7C2D12", background: "#FFEDD5", className: "bg-[#FFEDD5] text-[#7C2D12]" },
};

// WCAG contrast ratio of two #RRGGBB colours.
export function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((index) => {
      const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// "Heute" for today, otherwise "Sa 21.11." (dates are YYYY-MM-DD in Berlin time).
export function dayLabel(date: string, today: string) {
  if (date === today) return "Heute";
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.`;
}

// How long ago a request came in: "gerade eben", "vor 12 Min.", "vor 3 Std.", "vor 2 Tagen".
export function agoLabel(createdAt: string, now: Date = new Date()) {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "";
  const minutes = Math.max(0, Math.floor((now.getTime() - created) / 60000));
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "vor 1 Tag" : `vor ${days} Tagen`;
}

// "1 Gast" / "4 Gäste".
export function guestsLabel(count: number) {
  return count === 1 ? "1 Gast" : `${count} Gäste`;
}

// The phone number for a tel: link, without spaces, slashes or brackets.
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// Chips above the day list. "Alle" and the everyday statuses always show; rarer ones only when they occur.
const ALWAYS_SHOWN: ReservationStatus[] = ["pending", "confirmed", "arrived", "completed", "cancelled"];
const SHOWN_WHEN_USED: ReservationStatus[] = ["seated", "declined", "no_show"];

export function filterChips(statuses: string[]) {
  const count = (status: string) => statuses.filter((value) => value === status).length;
  return [
    { value: "", label: "Alle", count: statuses.length },
    ...ALWAYS_SHOWN.map((status) => ({ value: status, label: STATUS_LABELS[status], count: count(status) })),
    ...SHOWN_WHEN_USED.filter((status) => count(status) > 0).map((status) => ({ value: status, label: STATUS_LABELS[status], count: count(status) })),
  ];
}

// "3 warten auf Antwort" / "1 wartet auf Antwort".
export function waitingLabel(count: number) {
  return count === 1 ? "1 wartet auf Antwort" : `${count} warten auf Antwort`;
}

// The booking form stores codes ("birthday", "vegetarian"); staff read the German words.
const OCCASIONS: Record<string, string> = { birthday: "Geburtstag", anniversary: "Jahrestag" };
const DIETARY: Record<string, string> = { vegetarian: "Vegetarisch", vegan: "Vegan" };
export function occasionLabel(value: string | null | undefined) {
  const clean = (value || "").trim();
  return OCCASIONS[clean] || clean;
}
export function dietaryLabel(value: string | null | undefined) {
  const clean = (value || "").trim();
  return DIETARY[clean] || clean;
}
