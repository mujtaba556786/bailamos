// Homepage hero carousel: validation, date window, order, timestamps, admin helpers, hero uploads.
// Run: npm run test:hero
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WELCOME_SLIDE, DEFAULT_HERO_CAROUSEL, MAX_HERO_SLIDES, HERO_LIMITS, safeHref, safeImage, heroSlideErrors, validateHeroSlide, validateHeroCarousel,
  stampHeroSlides, visibleHeroSlides, heroSlideState, newHeroSlide, duplicateHeroSlide, moveHeroSlide, heroSlideId,
} from "../lib/hero-slides.ts";
import { validateMarketingContent } from "../lib/marketing-content.ts";
import { contentChanges, missingEnglish, publishBlockers, CONTENT_SECTIONS, heroTranslationJobs, applyHeroTranslations } from "../lib/content-admin.ts";
import { detectMediaType, uploadPolicy, HERO_UPLOAD_TYPES, MAX_HERO_UPLOAD_BYTES } from "../lib/media-upload.ts";
import defaults from "../data/marketing.json" with { type: "json" };

const slide = (patch = {}) => ({ ...structuredClone(WELCOME_SLIDE), id: "test", ...patch });
const rejects = (fn, pattern) => assert.throws(fn, (error) => error.status === 400 && pattern.test(error.message));

test("links: own pages, anchors and https only", () => {
  for (const ok of ["/menu", "/en/events", "/reservieren?date=2026-12-24", "#reservieren", "https://www.instagram.com/bailamos"]) assert.equal(safeHref(ok), true, ok);
  for (const bad of ["", "javascript:alert(1)", "http://example.com", "//evil.example", "/\\evil", "data:text/html,x", "#1bad", "/menu page", "ftp://x", "x".repeat(301), "/a\u0007"]) assert.equal(safeHref(bad), false, bad);
  assert.equal(safeImage("/api/media/marketing%2Fhero%2Fa.webp"), true);
  assert.equal(safeImage("https://cdn.example.com/a.jpg"), true);
  for (const bad of ["", "javascript:x", "http://x/a.jpg", "//x/a.jpg", "a b.jpg"]) assert.equal(safeImage(bad), false, bad);
});

test("field errors: headline, image, button, dates, lengths", () => {
  assert.deepEqual(heroSlideErrors(slide()), {});
  const errors = heroSlideErrors(slide({ headline: { de: " ", en: "x" }, image: "", ctaHref: "javascript:x", startsAt: "2026-02-30" }));
  assert.match(errors.headline, /Überschrift/);
  assert.match(errors.image, /Bild/);
  assert.match(errors.ctaHref, /https/);
  assert.match(errors.dates, /gültige/);
  assert.match(heroSlideErrors(slide({ ctaHref: "" })).ctaHref, /Ziel/);
  assert.match(heroSlideErrors(slide({ ctaLabel: { de: "", en: "" } })).ctaLabel, /Beschriftung/);
  assert.deepEqual(heroSlideErrors(slide({ ctaLabel: { de: "", en: "" }, ctaHref: "" })), {});
  assert.match(heroSlideErrors(slide({ startsAt: "2026-12-24", endsAt: "2026-12-01" })).dates, /vor/);
  assert.match(heroSlideErrors(slide({ subline: { de: "x".repeat(HERO_LIMITS.subline + 1), en: "" } })).length, /subline/);
});

test("server validation cleans text, falls back to German and refuses bad input", () => {
  const clean = validateHeroSlide({ ...slide(), headline: { de: "  Weihnachten  ", en: "" }, badge: undefined, order: 7, active: undefined }, 2);
  assert.equal(clean.headline.de, "Weihnachten");
  assert.equal(clean.headline.en, "Weihnachten");
  assert.deepEqual(clean.badge, { de: "", en: "" });
  assert.equal(clean.order, 2);
  assert.equal(clean.active, true);
  assert.equal(validateHeroSlide({ ...slide(), active: false }, 0).active, false);
  assert.equal(validateHeroSlide({ ...slide(), createdAt: "2026-11-01T10:00:00+01:00" }, 0).createdAt, "2026-11-01T09:00:00.000Z");
  rejects(() => validateHeroSlide(null, 0), /Folie 1/);
  rejects(() => validateHeroSlide([], 0), /Folie 1/);
  rejects(() => validateHeroSlide({ ...slide(), id: "Böse ID" }, 0), /ID/);
  rejects(() => validateHeroSlide({ ...slide(), headline: { de: "", en: "Only English" } }, 0), /Überschrift/);
  rejects(() => validateHeroSlide({ ...slide(), headline: { de: "x".repeat(81), en: "" } }, 0), /höchstens 80/);
  rejects(() => validateHeroSlide({ ...slide(), headline: { de: 5, en: "" } }, 0), /ungültig/);
  rejects(() => validateHeroSlide({ ...slide(), subline: { de: "a\u0000b", en: "" } }, 0), /ungültig/);
  rejects(() => validateHeroSlide({ ...slide(), ctaHref: "javascript:alert(1)" }, 0), /Button|https/);
  rejects(() => validateHeroSlide({ ...slide(), createdAt: "yesterday" }, 0), /Zeitstempel/);
  rejects(() => validateHeroSlide({ ...slide(), image: "" }, 0), /Bild/);
});

test("carousel document: default, order, limits, unique ids, switches", () => {
  assert.deepEqual(validateHeroCarousel(undefined), DEFAULT_HERO_CAROUSEL);
  assert.notEqual(validateHeroCarousel(null).slides, DEFAULT_HERO_CAROUSEL.slides);
  const sorted = validateHeroCarousel({ slides: [slide({ id: "b", order: 5 }), slide({ id: "a", order: 1 }), slide({ id: "c", order: undefined })], showEvents: false });
  assert.deepEqual(sorted.slides.map((s) => `${s.id}${s.order}`), ["a0", "c1", "b2"]);
  assert.equal(sorted.showEvents, false);
  assert.equal(sorted.showDishes, true);
  assert.deepEqual(validateHeroCarousel({ slides: [] }).slides, []);
  rejects(() => validateHeroCarousel("x"), /Karussell/);
  rejects(() => validateHeroCarousel({ slides: "x" }), /Folien/);
  rejects(() => validateHeroCarousel({ slides: Array.from({ length: MAX_HERO_SLIDES + 1 }, (_, i) => slide({ id: `s${i}` })) }), /Höchstens/);
  rejects(() => validateHeroCarousel({ slides: [slide({ id: "a" }), slide({ id: "a" })] }), /eindeutig/);
});

test("the homepage shows active slides inside their dates, in order", () => {
  const slides = validateHeroCarousel({ slides: [
    slide({ id: "always" }),
    slide({ id: "off", active: false }),
    slide({ id: "xmas", startsAt: "2026-12-01", endsAt: "2026-12-26" }),
    slide({ id: "nye", startsAt: "2026-12-27", endsAt: "2027-01-01" }),
    slide({ id: "old", endsAt: "2026-11-01" }),
  ] }).slides;
  const ids = (today) => visibleHeroSlides(slides, today).map((s) => s.id).join(",");
  assert.equal(ids("2026-11-20"), "always");
  assert.equal(ids("2026-12-01"), "always,xmas");
  assert.equal(ids("2026-12-26"), "always,xmas");
  assert.equal(ids("2026-12-31"), "always,nye");
  assert.equal(ids("2027-01-02"), "always");
  assert.deepEqual(visibleHeroSlides([slide({ id: "b", order: 2 }), slide({ id: "a", order: 1 })], "2026-11-20").map((s) => s.id), ["a", "b"]);
});

test("timestamps come from the server: createdAt stays, updatedAt follows changes", () => {
  const before = [slide({ id: "a", createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-02T00:00:00.000Z" }), slide({ id: "b", createdAt: "", updatedAt: "" })];
  const now = "2026-11-15T12:00:00.000Z";
  const [same, edited, created] = stampHeroSlides(before, [{ ...before[0], order: 3 }, { ...before[1], headline: { de: "Neu", en: "New" } }, slide({ id: "c", createdAt: "1999-01-01T00:00:00.000Z" })], now);
  assert.equal(same.createdAt, "2026-11-01T00:00:00.000Z");
  assert.equal(same.updatedAt, "2026-11-02T00:00:00.000Z");
  assert.equal(edited.createdAt, now);
  assert.equal(edited.updatedAt, now);
  assert.equal(created.createdAt, now);
  assert.equal(created.updatedAt, now);
});

test("admin list helpers: state, new, duplicate, move, ids", () => {
  assert.deepEqual(heroSlideState(slide({ active: false }), "2026-11-15"), { label: "Ausgeschaltet", tone: "off" });
  assert.deepEqual(heroSlideState(slide({ startsAt: "2026-12-01" }), "2026-11-15"), { label: "Geplant ab 01.12.2026", tone: "planned" });
  assert.deepEqual(heroSlideState(slide({ endsAt: "2026-11-01" }), "2026-11-15"), { label: "Abgelaufen am 01.11.2026", tone: "expired" });
  assert.deepEqual(heroSlideState(slide({ endsAt: "2026-12-26" }), "2026-11-15"), { label: "Sichtbar bis 26.12.2026", tone: "live" });
  assert.deepEqual(heroSlideState(slide(), "2026-11-15"), { label: "Sichtbar", tone: "live" });
  const fresh = newHeroSlide("folie-1", 4);
  assert.equal(fresh.order, 4);
  assert.match(heroSlideErrors(fresh).image, /Bild/);
  const list = [slide({ id: "a", order: 0 }), slide({ id: "b", order: 1 }), slide({ id: "c", order: 2 })];
  const copied = duplicateHeroSlide(list, 0, "a-copy");
  assert.deepEqual(copied.map((s) => `${s.id}${s.order}`), ["a0", "a-copy1", "b2", "c3"]);
  assert.equal(copied[1].active, false);
  assert.match(copied[1].headline.de, /\(Kopie\)$/);
  assert.match(copied[1].headline.en, /\(copy\)$/);
  assert.equal(duplicateHeroSlide([slide({ id: "x", headline: { de: "Nur Deutsch", en: "" } })], 0, "y")[1].headline.en, "");
  assert.equal(duplicateHeroSlide(list, 9, "z"), list);
  assert.deepEqual(moveHeroSlide(list, 2, 0).map((s) => `${s.id}${s.order}`), ["c0", "a1", "b2"]);
  assert.equal(moveHeroSlide(list, 1, 1), list);
  assert.equal(moveHeroSlide(list, 0, 5), list);
  assert.equal(heroSlideId(["folie-1"], "folie-2"), "folie-2");
  assert.equal(heroSlideId(["folie-1", "folie-1-2"], "folie-1"), "folie-1-3");
  assert.match(heroSlideId([]), /^folie-\d+$/);
});

test("content document: old saves get the welcome slide, admin counts changes and blocks incomplete slides", () => {
  const content = validateMarketingContent(defaults);
  assert.deepEqual(content.heroCarousel, DEFAULT_HERO_CAROUSEL);
  assert.ok(CONTENT_SECTIONS.some((section) => section.id === "karussell"));
  const draft = structuredClone(content);
  draft.heroCarousel.showDishes = false;
  draft.heroCarousel.slides.push({ ...newHeroSlide("folie-2", 1), headline: { de: "Silvester", en: "Silvester" } });
  assert.equal(contentChanges(content, draft).karussell, 2);
  assert.ok(missingEnglish(draft).karussell.includes("Silvester: Überschrift"));
  const blockers = publishBlockers(draft).filter((item) => item.section === "karussell");
  assert.equal(blockers.length, 1);
  assert.match(blockers[0].text, /Silvester: Bitte ein Bild hochladen/);
  assert.throws(() => validateMarketingContent({ ...defaults, heroCarousel: { slides: [{ ...WELCOME_SLIDE, ctaHref: "javascript:x" }] } }), /Button-Ziel|https/);
});

test("hero uploads: photos incl. AVIF, 5 MB, no video or SVG; AVIF is not mistaken for MP4", () => {
  const brand = (name) => { const out = new Uint8Array(16); out.set([..."ftyp"].map((c) => c.charCodeAt(0)), 4); out.set([...name].map((c) => c.charCodeAt(0)), 8); return out; };
  assert.equal(detectMediaType(brand("avif")), "image/avif");
  assert.equal(detectMediaType(brand("avis")), "image/avif");
  assert.equal(detectMediaType(brand("isom")), "video/mp4");
  const hero = uploadPolicy("hero"), general = uploadPolicy(null);
  assert.deepEqual(Object.keys(hero.types).sort(), ["image/avif", "image/jpeg", "image/png", "image/webp"]);
  assert.deepEqual(Object.keys(HERO_UPLOAD_TYPES).sort(), Object.keys(hero.types).sort());
  assert.equal(hero.maxBytes, 5 * 1024 * 1024);
  assert.equal(MAX_HERO_UPLOAD_BYTES, hero.maxBytes);
  assert.equal(hero.folder, "marketing/hero");
  assert.ok(!("image/svg+xml" in hero.types) && !("video/mp4" in hero.types));
  assert.equal(general.folder, "marketing");
  assert.ok(!("image/avif" in general.types));
  assert.equal(uploadPolicy("something-else").maxBytes, general.maxBytes);
});

test("Englisch generieren: only carousel texts without English, written back by slide", () => {
  const content = validateMarketingContent(defaults);
  content.heroCarousel.slides = [
    slide({ id: "done" }),
    slide({ id: "todo", badge: { de: "Neu", en: "" }, headline: { de: "Silvester", en: "Silvester" }, subline: { de: "", en: "" }, ctaLabel: { de: "Mehr", en: "More" }, alt: { de: "Feuerwerk", en: "" } }),
  ];
  const jobs = heroTranslationJobs(content);
  assert.deepEqual(jobs.map((job) => `${job.slideId}.${job.field}:${job.text}`), ["todo.badge:Neu", "todo.headline:Silvester", "todo.alt:Feuerwerk"]);
  const removed = structuredClone(content);
  applyHeroTranslations(content, jobs, ["New", "New Year's Eve", " "]);
  const todo = content.heroCarousel.slides[1];
  assert.equal(todo.badge.en, "New");
  assert.equal(todo.headline.en, "New Year's Eve");
  assert.equal(todo.alt.en, "", "empty translation leaves the field alone");
  assert.equal(todo.ctaLabel.en, "More", "hand-written English stays");
  assert.deepEqual(content.heroCarousel.slides[0], slide({ id: "done" }));
  removed.heroCarousel.slides = [];
  applyHeroTranslations(removed, jobs, ["a", "b", "c"]);
  assert.deepEqual(removed.heroCarousel.slides, []);
});
