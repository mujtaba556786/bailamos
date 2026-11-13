// Helpers for the "Website-Inhalte" admin tab. No React here, so the logic can be tested on its own.
import type { MarketingContent } from "./marketing-content.ts";
import { SOCIAL_PLATFORMS, socialUrlError } from "./social-links.ts";

export const CONTENT_SECTIONS = [
  { id: "startseite", label: "Startseite", view: "/" },
  { id: "events", label: "Events", view: "/events" },
  { id: "medien", label: "Galerie & Videos", view: "/#atmosphere" },
  { id: "social", label: "Social Media", view: "/#atmosphere" },
  { id: "eroeffnung", label: "Eröffnung", view: "/opening" },
] as const;
export type ContentSection = (typeof CONTENT_SECTIONS)[number]["id"];

// Reads ?section= from the address bar. Unknown or missing values open the first sub-tab.
export function sectionFromSearch(search: string): ContentSection {
  const value = new URLSearchParams(search).get("section");
  return CONTENT_SECTIONS.some((section) => section.id === value) ? (value as ContentSection) : "startseite";
}

type Pair = { de: string; en: string };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Counts changed items between two lists, matched by a key: new, removed and edited items,
// plus one more if the remaining items were reordered.
function listChanges<T>(before: T[], after: T[], key: (item: T, index: number) => string) {
  const old = new Map(before.map((item, index) => [key(item, index), item]));
  const current = new Map(after.map((item, index) => [key(item, index), item]));
  let count = 0;
  for (const [id, item] of current) if (!old.has(id) || !same(old.get(id), item)) count++;
  for (const id of old.keys()) if (!current.has(id)) count++;
  const kept = (list: Map<string, T>, other: Map<string, T>) => [...list.keys()].filter((id) => other.has(id));
  if (kept(old, current).join("|") !== kept(current, old).join("|")) count++;
  return count;
}

export type SectionChanges = Record<ContentSection, number>;

// Number of unpublished changes per sub-tab. Publishing always sends all sections together.
export function contentChanges(saved: MarketingContent | null, draft: MarketingContent | null): SectionChanges {
  const empty: SectionChanges = { startseite: 0, events: 0, medien: 0, social: 0, eroeffnung: 0 };
  if (!saved || !draft) return empty;
  return {
    startseite:
      (same(saved.announcement, draft.announcement) ? 0 : 1) +
      listChanges(saved.storyTiles, draft.storyTiles, (tile) => tile.id) +
      (same(saved.favourites, draft.favourites) ? 0 : 1),
    events: listChanges(saved.events, draft.events, (event) => event.id),
    medien:
      listChanges(saved.demoMedia.gallery, draft.demoMedia.gallery, (item) => `bild:${item.image}`) +
      listChanges(saved.demoMedia.videos, draft.demoMedia.videos, (item) => `video:${item.url}`),
    social: (Object.keys(draft.social) as Array<keyof MarketingContent["social"]>).filter((network) => !same(saved.social[network], draft.social[network])).length,
    eroeffnung: same(saved.opening, draft.opening) ? 0 : 1,
  };
}

export function totalChanges(changes: SectionChanges) {
  return Object.values(changes).reduce((sum, value) => sum + value, 0);
}

// True when the English text is missing: empty while German exists, or still the German text
// (the server copies German into English when English is left empty).
export function englishMissing(pair: Pair | undefined) {
  if (!pair) return false;
  const de = pair.de?.trim() ?? "", en = pair.en?.trim() ?? "";
  if (!de) return false;
  return !en || en === de;
}

// Where English is missing, per sub-tab, with a readable label for each field.
export function missingEnglish(content: MarketingContent): Record<ContentSection, string[]> {
  const result: Record<ContentSection, string[]> = { startseite: [], events: [], medien: [], social: [], eroeffnung: [] };
  const check = (section: ContentSection, label: string, pair: Pair | undefined) => { if (englishMissing(pair)) result[section].push(label); };
  if (content.announcement.enabled) check("startseite", "Ankündigung", content.announcement);
  content.storyTiles.forEach((tile, index) => {
    check("startseite", `Kachel ${index + 1}: Titel`, tile.title);
    check("startseite", `Kachel ${index + 1}: Kurztext`, tile.text);
  });
  check("startseite", "Unsere Lieblinge: kleine Überschrift", content.favourites.eyebrow);
  check("startseite", "Unsere Lieblinge: Überschrift", content.favourites.heading);
  for (const event of content.events) {
    const name = event.title.de || "Event ohne Titel";
    check("events", `${name}: Titel`, event.title);
    check("events", `${name}: Beschreibung`, event.summary);
    check("events", `${name}: Kurztext`, event.teaser);
  }
  content.demoMedia.gallery.forEach((item, index) => check("medien", `Bild ${index + 1}: Titel`, item.label));
  content.demoMedia.videos.forEach((item, index) => check("medien", `Video ${index + 1}: Titel`, item.title));
  check("eroeffnung", "Überschrift", content.opening.headline);
  check("eroeffnung", "Text", content.opening.message);
  return result;
}

// Short list of what will change, for the "Vorschau" dialog before publishing.
export function changeSummary(saved: MarketingContent | null, draft: MarketingContent | null) {
  const changes = contentChanges(saved, draft);
  return CONTENT_SECTIONS.filter((section) => changes[section.id] > 0).map((section) => ({ id: section.id, label: section.label, count: changes[section.id] }));
}

// ---------- Events ----------
export type ContentEvent = MarketingContent["events"][number];
export type EventStatus = "Entwurf" | "Live" | "Vergangen";

// Today's date in Berlin as YYYY-MM-DD, so "past" switches at local midnight.
export function berlinToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function eventStatus(event: ContentEvent, today: string): EventStatus {
  if (event.date && event.date < today) return "Vergangen";
  return event.published ? "Live" : "Entwurf";
}

// Upcoming events sorted by date (events without a date first, as they still need planning),
// past events in a separate archive, newest first. Each entry keeps its index in the stored list.
export function groupEvents(events: ContentEvent[], today: string) {
  const entries = events.map((event, index) => ({ event, index }));
  const upcoming = entries.filter(({ event }) => !event.date || event.date >= today)
    .sort((a, b) => (a.event.date || "").localeCompare(b.event.date || "") || (a.event.time || "").localeCompare(b.event.time || ""));
  const archive = entries.filter(({ event }) => event.date && event.date < today)
    .sort((a, b) => b.event.date.localeCompare(a.event.date));
  return { upcoming, archive };
}

// "Noche de Mezcal" + 2026-12-12 -> "noche-de-mezcal-2026". Adds -2, -3 … if the id is taken.
export function slugify(value: string) {
  return value.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/g, "");
}

export function eventSlug(title: string, date: string, takenIds: Iterable<string>, now = new Date()) {
  const taken = new Set(takenIds);
  const year = /^\d{4}/.test(date) ? date.slice(0, 4) : String(now.getFullYear());
  const base = `${slugify(title) || "event"}-${year}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

// Problems that stop publishing. The server rejects these too; here they are shown next to the field.
export function eventErrors(event: ContentEvent) {
  const errors: Partial<Record<"title" | "summary" | "date" | "time", string>> = {};
  if (!event.title.de.trim()) errors.title = "Titel fehlt. Ohne Titel kann das Event nicht veröffentlicht oder auf der Startseite gezeigt werden.";
  if (!event.summary.de.trim()) errors.summary = "Beschreibung fehlt.";
  if (event.published && !event.date) errors.date = "Für veröffentlichte Events ist ein Datum nötig.";
  if (event.published && !event.time) errors.time = "Für veröffentlichte Events ist eine Uhrzeit nötig.";
  return errors;
}

// Everything that must be fixed before "Veröffentlichen" works: readable text plus the sub-tab to fix it in.
export type PublishBlocker = { section: ContentSection; text: string };
export function publishBlockers(content: MarketingContent): PublishBlocker[] {
  const events = content.events.flatMap((event) => {
    const errors = eventErrors(event), name = event.title.de.trim() || "Event ohne Titel";
    return Object.values(errors).length ? [{ section: "events" as const, text: `${name}: ${Object.values(errors).map((text) => text.split(".")[0]).join(", ")}` }] : [];
  });
  const images = content.demoMedia.gallery.flatMap((item, index) => (item.label.de.trim() ? [] : [{ section: "medien" as const, text: `Bild ${index + 1}: Titel fehlt (wird als Bildbeschreibung gebraucht)` }]));
  const videos = content.demoMedia.videos.flatMap((item, index) => (item.title.de.trim() ? [] : [{ section: "medien" as const, text: `Video ${index + 1}: Titel fehlt` }]));
  const social = SOCIAL_PLATFORMS.flatMap((platform) => {
    const problem = socialUrlError(platform.id, content.social[platform.id].url);
    return problem ? [{ section: "social" as const, text: `${platform.label}: Link prüfen` }] : [];
  });
  const tiles = content.storyTiles.flatMap((tile, index) => (tile.title.de.trim() ? [] : [{ section: "startseite" as const, text: `Fotokachel ${index + 1}: Titel fehlt` }]));
  return [...tiles, ...events, ...images, ...videos, ...social];
}

// ---------- "Unsere Lieblinge" dish picker ----------
export type PickerDish = { id: string; categoryId?: string; name: { de: string; en: string }; available: boolean };
export type PickerCategory = { id: string; name: { de: string; en: string } };

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Dishes grouped by menu category and filtered by the search text (German or English name).
// Dishes already chosen in another slot are marked, so the same dish cannot be picked twice.
export function dishOptions(dishes: PickerDish[], categories: PickerCategory[], query: string, chosenElsewhere: string[]) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const matches = (dish: PickerDish) => words.every((word) => fold(`${dish.name.de} ${dish.name.en}`).includes(word));
  const known = new Set(categories.map((category) => category.id));
  const groups = [...categories, { id: "", name: { de: "Weitere", en: "Other" } }].map((category) => ({
    category,
    dishes: dishes
      .filter((dish) => (category.id ? dish.categoryId === category.id : !dish.categoryId || !known.has(dish.categoryId)) && matches(dish))
      .map((dish) => ({ dish, taken: chosenElsewhere.includes(dish.id) })),
  }));
  return groups.filter((group) => group.dishes.length > 0);
}

// Sets one of the three slots. Empty clears it; a dish already in another slot is refused.
export function setFavourite(ids: string[], slot: number, dishId: string) {
  const next = [...ids];
  if (dishId && next.some((id, index) => id === dishId && index !== slot)) return ids;
  if (dishId) next[slot] = dishId; else next.splice(slot, 1);
  return next.filter(Boolean).slice(0, 3);
}

// ---------- Galerie & Videos ----------
// The image title is the alt text on the public site, so a missing or file-name-like title gets a warning.
export function titleWarning(label: Pair) {
  const de = label.de.trim();
  if (!de) return "Titel fehlt";
  if (/^(img|dsc|dscn|pxl|screenshot|whatsapp|signal)\b.*\d/i.test(de) || /^(photo|foto|bild|image)[-_ ]?\d/i.test(de) || /^[\w-]*\d{4,}[\w-]*$/.test(de)) return "Titel wie Dateiname";
  return "";
}
