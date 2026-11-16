// Homepage hero carousel: the slides the admin manages in "Website-Inhalte → Startseite-Karussell".
// Event and dish slides stay automatic (from Events and the menu); the two switches here turn them on or off.
// No React here, so validation, the date window and sorting can be tested on their own.
import { BookingError } from "./booking-policy.ts";

export type Pair = { de: string; en: string };
export type HeroSlide = {
  id: string;
  order: number;
  active: boolean;
  startsAt: string; // "" or YYYY-MM-DD (Berlin date), first day shown
  endsAt: string; // "" or YYYY-MM-DD, last day shown
  image: string;
  hasBakedText: boolean; // true: the image already shows its words; the site then adds no overlay text
  alt: Pair;
  badge: Pair;
  headline: Pair;
  subline: Pair;
  ctaLabel: Pair;
  ctaHref: string;
  createdAt: string;
  updatedAt: string;
};
export type HeroCarousel = { slides: HeroSlide[]; showEvents: boolean; showDishes: boolean };

export const MAX_HERO_SLIDES = 12;
export const HERO_LIMITS = { headline: 80, badge: 30, subline: 220, ctaLabel: 40, alt: 160, ctaHref: 300, image: 1000 } as const;

// The slide the homepage showed before the carousel became editable. Used until the admin saves slides,
// and as the last fallback when no slide at all would be shown.
export const WELCOME_SLIDE: HeroSlide = {
  id: "welcome",
  order: 0,
  active: true,
  startsAt: "",
  endsAt: "",
  image: "/restaurant/bar-interior.jpg",
  hasBakedText: false,
  alt: { de: "Die Bar im Bailamos am Abend", en: "The bar at Bailamos in the evening" },
  badge: { de: "Willkommen", en: "Welcome" },
  headline: { de: "Eine Nacht, die bleibt.", en: "A night to remember." },
  subline: {
    de: "Feuer, frische Aromen und Cocktails mit Charakter. Für lange Gespräche, große Momente und alles dazwischen.",
    en: "Fire, fresh flavours and cocktails with character. For long conversations, big moments and everything in between.",
  },
  ctaLabel: { de: "Tisch reservieren", en: "Reserve a table" },
  ctaHref: "#reservieren",
  createdAt: "2026-11-15T00:00:00.000Z",
  updatedAt: "2026-11-15T00:00:00.000Z",
};
export const DEFAULT_HERO_CAROUSEL: HeroCarousel = { slides: [WELCOME_SLIDE], showEvents: true, showDishes: true };

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validDay(value: string) {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Where a button may lead: a page of this site ("/menu"), an anchor on the same page ("#reservieren") or an https address.
export function safeHref(value: string) {
  const clean = value.trim();
  if (!clean || clean.length > HERO_LIMITS.ctaHref || CONTROL_CHARACTERS.test(clean) || /\s/.test(clean)) return false;
  if (clean.startsWith("/") && !clean.startsWith("//") && !clean.includes("\\")) return true;
  if (/^#[A-Za-z][\w-]*$/.test(clean)) return true;
  try { return new URL(clean).protocol === "https:"; } catch { return false; }
}

// Image addresses: a file of this site ("/restaurant/bar.jpg", uploads under "/api/media/…") or an https address.
export function safeImage(value: string) {
  const clean = value.trim();
  if (!clean || clean.length > HERO_LIMITS.image || CONTROL_CHARACTERS.test(clean) || /\s/.test(clean)) return false;
  if (clean.startsWith("/") && !clean.startsWith("//") && !clean.includes("\\")) return true;
  try { return new URL(clean).protocol === "https:"; } catch { return false; }
}

// Field problems in German, for the admin form (live) and for the server check (same rules).
export type HeroSlideErrors = Partial<Record<"headline" | "image" | "ctaHref" | "ctaLabel" | "dates" | "length", string>>;
export function heroSlideErrors(slide: HeroSlide): HeroSlideErrors {
  const errors: HeroSlideErrors = {};
  if (!slide.headline.de.trim()) errors.headline = "Überschrift (DE) fehlt.";
  if (!safeImage(slide.image)) errors.image = "Bitte ein Bild hochladen.";
  const label = slide.ctaLabel.de.trim() || slide.ctaLabel.en.trim(), href = slide.ctaHref.trim();
  if (label && !href) errors.ctaHref = "Bitte ein Ziel für den Button angeben.";
  else if (href && !safeHref(href)) errors.ctaHref = "Nur Seiten dieser Website (/…), Sprungmarken (#…) oder https-Adressen.";
  if (href && !label) errors.ctaLabel = "Bitte eine Button-Beschriftung angeben.";
  if ((slide.startsAt && !validDay(slide.startsAt)) || (slide.endsAt && !validDay(slide.endsAt))) errors.dates = "Bitte gültige Daten wählen.";
  else if (slide.startsAt && slide.endsAt && slide.endsAt < slide.startsAt) errors.dates = "„Bis“ darf nicht vor „Ab“ liegen.";
  const tooLong = (["headline", "badge", "subline", "ctaLabel", "alt"] as const).find((field) => slide[field].de.length > HERO_LIMITS[field] || slide[field].en.length > HERO_LIMITS[field]);
  if (tooLong) errors.length = `Ein Text ist zu lang (${tooLong}: höchstens ${HERO_LIMITS[tooLong]} Zeichen).`;
  return errors;
}

// ---------- server-side validation of the saved document ----------
function plain(value: unknown, label: string, max: number, required = false) {
  if (value === undefined || value === null) value = "";
  if (typeof value !== "string") throw new BookingError(400, "INVALID_HERO", `${label} ist ungültig.`);
  const clean = value.trim().normalize("NFC");
  if (CONTROL_CHARACTERS.test(clean) || clean.length > max) throw new BookingError(400, "INVALID_HERO", `${label} ist ungültig (höchstens ${max} Zeichen).`);
  if (required && !clean) throw new BookingError(400, "INVALID_HERO", `${label} fehlt.`);
  return clean;
}
// English falls back to German, like the other texts of the site.
function pairOf(value: unknown, label: string, max: number, required = false): Pair {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const de = plain(source.de, label, max, required);
  const en = plain(source.en, `Englisch: ${label}`, max) || de;
  return { de, en };
}
function stampOf(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.length > 40 || Number.isNaN(Date.parse(value))) throw new BookingError(400, "INVALID_HERO", "Ungültiger Zeitstempel.");
  return new Date(value).toISOString();
}

export function validateHeroSlide(value: unknown, index: number): HeroSlide {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BookingError(400, "INVALID_HERO", `Folie ${index + 1} ist ungültig.`);
  const v = value as Record<string, unknown>, name = `Folie ${index + 1}`;
  const id = plain(v.id, `${name}: ID`, 60, true);
  if (!ID.test(id)) throw new BookingError(400, "INVALID_HERO", `${name}: Die ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.`);
  const slide: HeroSlide = {
    id,
    order: index,
    active: v.active !== false,
    startsAt: plain(v.startsAt, `${name}: Startdatum`, 10),
    endsAt: plain(v.endsAt, `${name}: Enddatum`, 10),
    image: plain(v.image, `${name}: Bild`, HERO_LIMITS.image, true),
    hasBakedText: v.hasBakedText === true,
    alt: pairOf(v.alt, `${name}: Bildbeschreibung`, HERO_LIMITS.alt),
    badge: pairOf(v.badge, `${name}: Kennzeichnung`, HERO_LIMITS.badge),
    headline: pairOf(v.headline, `${name}: Überschrift`, HERO_LIMITS.headline, true),
    subline: pairOf(v.subline, `${name}: Text`, HERO_LIMITS.subline),
    ctaLabel: pairOf(v.ctaLabel, `${name}: Button-Text`, HERO_LIMITS.ctaLabel),
    ctaHref: plain(v.ctaHref, `${name}: Button-Ziel`, HERO_LIMITS.ctaHref),
    createdAt: stampOf(v.createdAt),
    updatedAt: stampOf(v.updatedAt),
  };
  const errors = heroSlideErrors(slide);
  const first = Object.values(errors)[0];
  if (first) throw new BookingError(400, "INVALID_HERO", `${name}: ${first}`);
  return slide;
}

// Reads the "heroCarousel" field of the content document. Missing (never saved) means the default with the welcome slide.
export function validateHeroCarousel(value: unknown): HeroCarousel {
  if (value === undefined || value === null) return structuredClone(DEFAULT_HERO_CAROUSEL);
  if (typeof value !== "object" || Array.isArray(value)) throw new BookingError(400, "INVALID_HERO", "Ungültige Karussell-Daten.");
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.slides) || v.slides.length > MAX_HERO_SLIDES) throw new BookingError(400, "INVALID_HERO", `Höchstens ${MAX_HERO_SLIDES} Folien.`);
  // Saved order wins; the array position breaks ties. Afterwards order is 0, 1, 2 … again.
  const orderOf = (slide: unknown, index: number) => {
    const order = slide && typeof slide === "object" ? (slide as { order?: unknown }).order : undefined;
    return typeof order === "number" && Number.isInteger(order) ? order : index;
  };
  const sorted = (v.slides as unknown[]).map((slide, index) => ({ slide, index, order: orderOf(slide, index) })).sort((a, b) => a.order - b.order || a.index - b.index);
  const slides = sorted.map((entry, index) => validateHeroSlide(entry.slide, index));
  const ids = new Set<string>();
  for (const slide of slides) { if (ids.has(slide.id)) throw new BookingError(400, "INVALID_HERO", "Folien-IDs müssen eindeutig sein."); ids.add(slide.id); }
  return { slides, showEvents: v.showEvents !== false, showDishes: v.showDishes !== false };
}

// createdAt stays from the saved version; updatedAt changes only when the slide itself changed. Timestamps come from the server.
export function stampHeroSlides(previous: HeroSlide[], next: HeroSlide[], now: string): HeroSlide[] {
  const before = new Map(previous.map((slide) => [slide.id, slide]));
  const body = (slide: HeroSlide) => JSON.stringify({ ...slide, order: 0, createdAt: "", updatedAt: "" });
  return next.map((slide) => {
    const old = before.get(slide.id);
    if (!old) return { ...slide, createdAt: now, updatedAt: now };
    return { ...slide, createdAt: old.createdAt || now, updatedAt: body(old) === body(slide) ? old.updatedAt || now : now };
  });
}

// ---------- public homepage ----------
// Slides shown on a given Berlin date: switched on, inside their date window, in their order.
export function visibleHeroSlides(slides: HeroSlide[], today: string) {
  return slides
    .filter((slide) => slide.active && (!slide.startsAt || slide.startsAt <= today) && (!slide.endsAt || today <= slide.endsAt))
    .sort((a, b) => a.order - b.order);
}

// The state shown next to a slide in the admin list.
export function heroSlideState(slide: HeroSlide, today: string): { label: string; tone: "live" | "planned" | "expired" | "off" } {
  if (!slide.active) return { label: "Ausgeschaltet", tone: "off" };
  if (slide.startsAt && today < slide.startsAt) return { label: `Geplant ab ${germanDay(slide.startsAt)}`, tone: "planned" };
  if (slide.endsAt && slide.endsAt < today) return { label: `Abgelaufen am ${germanDay(slide.endsAt)}`, tone: "expired" };
  return { label: slide.endsAt ? `Sichtbar bis ${germanDay(slide.endsAt)}` : "Sichtbar", tone: "live" };
}
function germanDay(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

// A new empty slide for the admin form; the image is added by upload before it can be published.
export function newHeroSlide(id: string, order: number): HeroSlide {
  return { id, order, active: true, startsAt: "", endsAt: "", image: "", hasBakedText: false, alt: { de: "", en: "" }, badge: { de: "", en: "" }, headline: { de: "", en: "" }, subline: { de: "", en: "" }, ctaLabel: { de: "", en: "" }, ctaHref: "", createdAt: "", updatedAt: "" };
}

// A copy placed right after the original, switched off so it does not appear on the website by surprise.
export function duplicateHeroSlide(slides: HeroSlide[], index: number, newId: string): HeroSlide[] {
  const source = slides[index];
  if (!source) return slides;
  const copy: HeroSlide = { ...structuredClone(source), id: newId, active: false, headline: { de: `${source.headline.de} (Kopie)`.slice(0, HERO_LIMITS.headline), en: source.headline.en ? `${source.headline.en} (copy)`.slice(0, HERO_LIMITS.headline) : "" }, createdAt: "", updatedAt: "" };
  const next = [...slides.slice(0, index + 1), copy, ...slides.slice(index + 1)];
  return next.map((slide, position) => ({ ...slide, order: position }));
}

// Moves a slide and renumbers the order (drag-and-drop and the arrow buttons).
export function moveHeroSlide(slides: HeroSlide[], from: number, to: number): HeroSlide[] {
  if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return slides;
  const next = [...slides];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((slide, position) => ({ ...slide, order: position }));
}

// Unique id for a new or copied slide ("folie-1700000000000", "-2" … if taken).
export function heroSlideId(existing: string[], base = `folie-${Date.now()}`) {
  let id = base, counter = 2;
  while (existing.includes(id)) id = `${base}-${counter++}`;
  return id;
}
