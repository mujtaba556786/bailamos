// Unit tests for the Website-Inhalte admin helpers. Run: npm run test:content-admin
import { test } from "node:test";
import assert from "node:assert/strict";
import defaults from "../data/marketing.json" with { type: "json" };
import { validateMarketingContent } from "../lib/marketing-content.ts";
import { socialUrlError, visibleSocialLinks, isEmptySocialUrl } from "../lib/social-links.ts";
import { CONTENT_SECTIONS, sectionFromSearch, contentChanges, totalChanges, englishMissing, missingEnglish, changeSummary, berlinToday, eventStatus, groupEvents, slugify, eventSlug, eventErrors, publishBlockers, dishOptions, setFavourite, titleWarning } from "../lib/content-admin.ts";

const base = () => validateMarketingContent(structuredClone(defaults));

test("sectionFromSearch reads ?section= and falls back to Startseite", () => {
  assert.equal(sectionFromSearch("?section=events"), "events");
  assert.equal(sectionFromSearch("?view=content&section=eroeffnung"), "eroeffnung");
  assert.equal(sectionFromSearch("?section=unbekannt"), "startseite");
  assert.equal(sectionFromSearch(""), "startseite");
});

test("no changes when draft equals saved, and with missing data", () => {
  const saved = base();
  assert.equal(totalChanges(contentChanges(saved, structuredClone(saved))), 0);
  assert.equal(totalChanges(contentChanges(null, saved)), 0);
  assert.deepEqual(changeSummary(saved, structuredClone(saved)), []);
});

test("changes are counted in the right sub-tab", () => {
  const saved = base(), draft = structuredClone(saved);
  draft.announcement.de = "Neu";
  draft.storyTiles[0].title.de = "Anders";
  draft.favourites.dishIds = ["x"];
  draft.opening.enabled = !draft.opening.enabled;
  draft.social.tiktok.handle = "@neu";
  assert.deepEqual(contentChanges(saved, draft), { startseite: 3, events: 0, medien: 0, social: 1, eroeffnung: 1 });
});

test("events: new, edited, removed and reordered are each counted", () => {
  const saved = base();
  saved.events = [
    { ...structuredClone(saved.events[0]), id: "a" },
    { ...structuredClone(saved.events[0]), id: "b" },
    { ...structuredClone(saved.events[0]), id: "c" },
  ];
  const added = structuredClone(saved); added.events.push({ ...structuredClone(saved.events[0]), id: "d" });
  assert.equal(contentChanges(saved, added).events, 1);
  const edited = structuredClone(saved); edited.events[1].title.de = "Geändert";
  assert.equal(contentChanges(saved, edited).events, 1);
  const removed = structuredClone(saved); removed.events.splice(0, 1);
  assert.equal(contentChanges(saved, removed).events, 1);
  const reordered = structuredClone(saved); reordered.events.reverse();
  assert.equal(contentChanges(saved, reordered).events, 1);
});

test("gallery and videos count under Galerie & Videos", () => {
  const saved = base(), draft = structuredClone(saved);
  draft.demoMedia.gallery.push({ label: { de: "Neu", en: "New" }, source: "Bailamos", url: "/neu.jpg", image: "/neu.jpg" });
  draft.demoMedia.videos.push({ title: { de: "Clip", en: "Clip" }, source: "Bailamos", url: "/clip.mp4", poster: "/p.jpg" });
  const changes = contentChanges(saved, draft);
  assert.equal(changes.medien, 2);
  assert.equal(totalChanges(changes), 2);
  assert.deepEqual(changeSummary(saved, draft), [{ id: "medien", label: "Galerie & Videos", count: 2 }]);
});

test("publishing sends every section: all sub-tabs map to fields of one document", () => {
  // The save bar publishes the whole content document. Every sub-tab must be backed by part of it.
  const content = base();
  const covered = { startseite: [content.announcement, content.storyTiles, content.favourites], events: [content.events], medien: [content.demoMedia], social: [content.social], eroeffnung: [content.opening] };
  for (const section of CONTENT_SECTIONS) assert.ok(covered[section.id].every((part) => part !== undefined), section.id);
  // And a change in any sub-tab survives server validation of the full document.
  const draft = structuredClone(content);
  draft.announcement.de = "Neu"; draft.social.tiktok.handle = "@neu"; draft.opening.headline.de = "Hallo";
  const saved = validateMarketingContent(draft);
  assert.equal(saved.announcement.de, "Neu");
  assert.equal(saved.social.tiktok.handle, "@neu");
  assert.equal(saved.opening.headline.de, "Hallo");
});

test("englishMissing: empty or still German", () => {
  assert.equal(englishMissing({ de: "Hallo", en: "" }), true);
  assert.equal(englishMissing({ de: "Hallo", en: " Hallo " }), true);
  assert.equal(englishMissing({ de: "Hallo", en: "Hello" }), false);
  assert.equal(englishMissing({ de: "", en: "" }), false);
  assert.equal(englishMissing(undefined), false);
});

test("missingEnglish lists fields per sub-tab", () => {
  const content = base();
  content.announcement = { enabled: true, de: "Neu", en: "Neu", link: "/" };
  content.storyTiles[0].title = { de: "Titel", en: "" };
  content.demoMedia.gallery = [{ label: { de: "Foto", en: "Foto" }, source: "B", url: "/a.jpg", image: "/a.jpg" }];
  content.demoMedia.videos = [{ title: { de: "Clip", en: "Clip" }, source: "B", url: "/a.mp4", poster: "/p.jpg" }];
  content.events = [{ ...content.events[0], title: { de: "Fiesta", en: "Fiesta" }, summary: { de: "Text", en: "Text" }, teaser: { de: "", en: "" } }];
  content.opening.message = { de: "Bald", en: "Bald" };
  const missing = missingEnglish(content);
  assert.ok(missing.startseite.includes("Ankündigung"));
  assert.ok(missing.startseite.includes("Kachel 1: Titel"));
  assert.deepEqual(missing.medien, ["Bild 1: Titel", "Video 1: Titel"]);
  assert.deepEqual(missing.events, ["Fiesta: Titel", "Fiesta: Beschreibung"]);
  assert.deepEqual(missing.eroeffnung.filter((x) => x === "Text"), ["Text"]);
  assert.deepEqual(missing.social, []);
  content.announcement.enabled = false;
  assert.ok(!missingEnglish(content).startseite.includes("Ankündigung"));
});

test("an event without a German title gets a readable label", () => {
  const content = base();
  content.events = [{ ...content.events[0], title: { de: "", en: "" }, summary: { de: "Text", en: "" } }];
  assert.deepEqual(missingEnglish(content).events, ["Event ohne Titel: Beschreibung"]);
});

const ev = (over) => ({ id: "x", title: { de: "Fiesta", en: "" }, summary: { de: "Text", en: "" }, teaser: { de: "", en: "" }, date: "2026-12-01", time: "19:00", image: "/a.jpg", showOnHome: true, featured: false, published: true, ...over });

test("berlinToday switches at Berlin midnight, not UTC", () => {
  assert.equal(berlinToday(new Date("2026-11-13T22:30:00Z")), "2026-11-13");
  assert.equal(berlinToday(new Date("2026-11-13T23:30:00Z")), "2026-11-14");
});

test("eventStatus: Entwurf, Live, Vergangen", () => {
  assert.equal(eventStatus(ev({ published: false }), "2026-11-13"), "Entwurf");
  assert.equal(eventStatus(ev({}), "2026-11-13"), "Live");
  assert.equal(eventStatus(ev({ date: "2026-11-13" }), "2026-11-13"), "Live");
  assert.equal(eventStatus(ev({ date: "2026-11-01" }), "2026-11-13"), "Vergangen");
  assert.equal(eventStatus(ev({ date: "", published: false }), "2026-11-13"), "Entwurf");
});

test("groupEvents sorts upcoming by date and time, archives past events newest first, keeps indexes", () => {
  const events = [ev({ id: "c", date: "2026-12-20" }), ev({ id: "old", date: "2026-10-01" }), ev({ id: "b2", date: "2026-12-01", time: "21:00" }), ev({ id: "nodate", date: "" }), ev({ id: "b1", date: "2026-12-01", time: "18:00" }), ev({ id: "older", date: "2026-09-01" })];
  const { upcoming, archive } = groupEvents(events, "2026-11-13");
  assert.deepEqual(upcoming.map((e) => e.event.id), ["nodate", "b1", "b2", "c"]);
  assert.deepEqual(archive.map((e) => e.event.id), ["old", "older"]);
  assert.equal(upcoming[0].index, 3);
});

test("slugify handles umlauts, accents and symbols", () => {
  assert.equal(slugify("Noche de Mezcal!"), "noche-de-mezcal");
  assert.equal(slugify("Grüße & Spaß – Fiesta Ñ"), "gruesse-spass-fiesta-n");
  assert.equal(slugify("   "), "");
  assert.ok(slugify("a".repeat(100)).length <= 70);
});

test("eventSlug adds the year and stays unique", () => {
  assert.equal(eventSlug("Noche de Mezcal", "2026-12-12", []), "noche-de-mezcal-2026");
  assert.equal(eventSlug("Noche de Mezcal", "2026-12-12", ["noche-de-mezcal-2026"]), "noche-de-mezcal-2026-2");
  assert.equal(eventSlug("Noche de Mezcal", "2026-12-12", ["noche-de-mezcal-2026", "noche-de-mezcal-2026-2"]), "noche-de-mezcal-2026-3");
  assert.equal(eventSlug("", "", [], new Date("2027-03-01")), "event-2027");
});

test("eventErrors: title required always; date and time only when published", () => {
  assert.deepEqual(eventErrors(ev({})), {});
  assert.ok(eventErrors(ev({ title: { de: " ", en: "" } })).title.startsWith("Titel fehlt"));
  assert.ok(eventErrors(ev({ summary: { de: "", en: "" } })).summary);
  assert.ok(eventErrors(ev({ date: "" })).date);
  assert.ok(eventErrors(ev({ time: "" })).time);
  assert.deepEqual(eventErrors(ev({ date: "", time: "", published: false })), {});
});

test("publishBlockers lists every event that needs fixing", () => {
  const content = base();
  content.events = [ev({ id: "ok" }), ev({ id: "a", title: { de: "", en: "" } }), ev({ id: "b", title: { de: "Party", en: "" }, date: "" })];
  assert.deepEqual(publishBlockers(content), [{ section: "events", text: "Event ohne Titel: Titel fehlt" }, { section: "events", text: "Party: Für veröffentlichte Events ist ein Datum nötig" }]);
  content.events = [ev({})];
  assert.deepEqual(publishBlockers(content), []);
});

const dishes = [
  { id: "taco", categoryId: "tacos", name: { de: "Taco Pollo", en: "Chicken taco" }, available: true },
  { id: "jalapeno", categoryId: "tacos", name: { de: "Taco Jalapeño", en: "Jalapeño taco" }, available: false },
  { id: "flan", categoryId: "postres", name: { de: "Flan", en: "Flan" }, available: true },
  { id: "geheim", categoryId: "geloescht", name: { de: "Geheim", en: "Secret" }, available: true },
];
const cats = [{ id: "tacos", name: { de: "Tacos", en: "Tacos" } }, { id: "postres", name: { de: "Desserts", en: "Desserts" } }];

test("dishOptions groups by category, searches both languages and accents", () => {
  assert.deepEqual(dishOptions(dishes, cats, "", []).map((g) => [g.category.id, g.dishes.map((d) => d.dish.id)]), [["tacos", ["taco", "jalapeno"]], ["postres", ["flan"]], ["", ["geheim"]]]);
  assert.deepEqual(dishOptions(dishes, cats, "jalapeno", []).flatMap((g) => g.dishes.map((d) => d.dish.id)), ["jalapeno"]);
  assert.deepEqual(dishOptions(dishes, cats, "chicken", []).flatMap((g) => g.dishes.map((d) => d.dish.id)), ["taco"]);
  assert.deepEqual(dishOptions(dishes, cats, "xyz", []), []);
});

test("dishOptions marks dishes chosen in another slot", () => {
  const taken = dishOptions(dishes, cats, "", ["flan"]).flatMap((g) => g.dishes).filter((d) => d.taken).map((d) => d.dish.id);
  assert.deepEqual(taken, ["flan"]);
});

test("setFavourite sets, clears and refuses duplicates", () => {
  assert.deepEqual(setFavourite([], 0, "taco"), ["taco"]);
  assert.deepEqual(setFavourite(["taco"], 1, "flan"), ["taco", "flan"]);
  assert.deepEqual(setFavourite(["taco", "flan"], 0, "jalapeno"), ["jalapeno", "flan"]);
  const ids = ["taco", "flan"];
  assert.equal(setFavourite(ids, 1, "taco"), ids);
  assert.deepEqual(setFavourite(["taco", "flan", "x"], 1, ""), ["taco", "x"]);
  assert.deepEqual(setFavourite(["a", "b", "c"], 3, "d"), ["a", "b", "c"]);
});

test("titleWarning flags empty and file-name-like image titles", () => {
  assert.equal(titleWarning({ de: "", en: "" }), "Titel fehlt");
  assert.equal(titleWarning({ de: "IMG_4021", en: "" }), "Titel wie Dateiname");
  assert.equal(titleWarning({ de: "PXL_20261012_183455", en: "" }), "Titel wie Dateiname");
  assert.equal(titleWarning({ de: "WhatsApp Image 2026-10-01", en: "" }), "Titel wie Dateiname");
  assert.equal(titleWarning({ de: "20261012-183455", en: "" }), "Titel wie Dateiname");
  assert.equal(titleWarning({ de: "Terrasse am Abend", en: "" }), "");
  assert.equal(titleWarning({ de: "Bild vom Grill", en: "" }), "");
  assert.equal(titleWarning({ de: "Foto_12", en: "" }), "Titel wie Dateiname");
  assert.equal(titleWarning({ de: "Foto 1 von der Terrasse", en: "" }), "Titel wie Dateiname");
});

test("publishBlockers: images and videos need a German title", () => {
  const content = base();
  content.events = [];
  content.demoMedia.gallery = [{ label: { de: "", en: "" }, source: "B", url: "/a.jpg", image: "/a.jpg" }, { label: { de: "Bar", en: "" }, source: "B", url: "/b.jpg", image: "/b.jpg" }];
  content.demoMedia.videos = [{ title: { de: " ", en: "" }, source: "B", url: "/a.mp4", poster: "/p.jpg" }];
  assert.deepEqual(publishBlockers(content), [{ section: "medien", text: "Bild 1: Titel fehlt (wird als Bildbeschreibung gebraucht)" }, { section: "medien", text: "Video 1: Titel fehlt" }]);
});

test("socialUrlError accepts real profile links and rejects others", () => {
  assert.equal(socialUrlError("instagram", "https://www.instagram.com/bailamos.waldcafe/"), "");
  assert.equal(socialUrlError("facebook", "https://m.facebook.com/bailamos"), "");
  assert.equal(socialUrlError("youtube", "https://youtu.be/abc"), "");
  assert.equal(socialUrlError("tiktok", "https://www.tiktok.com/@bailamos.waldcafe"), "");
  assert.equal(socialUrlError("tiktok", "#"), "");
  assert.equal(socialUrlError("tiktok", ""), "");
  assert.match(socialUrlError("instagram", "https://www.tiktok.com/@x"), /keine Instagram-Adresse/);
  assert.match(socialUrlError("instagram", "https://evilinstagram.com/x"), /keine Instagram-Adresse/);
  assert.match(socialUrlError("facebook", "http://facebook.com/x"), /https/);
  assert.match(socialUrlError("facebook", "facebook.com/x"), /vollständige Adresse/);
  assert.match(socialUrlError("youtube", "https://www.youtube.com/"), /Profils/);
  assert.match(socialUrlError("instagram", "javascript:alert(1)"), /https/);
});

test("visibleSocialLinks hides empty and invalid links, keeps display order", () => {
  const social = { instagram: { url: "#", handle: "" }, facebook: { url: "https://facebook.com/b", handle: "" }, tiktok: { url: "https://example.com/x", handle: "" }, youtube: { url: " https://youtube.com/@b ", handle: "" } };
  assert.deepEqual(visibleSocialLinks(social), [["Facebook", "https://facebook.com/b"], ["YouTube", "https://youtube.com/@b"]]);
  assert.equal(isEmptySocialUrl(" # "), true);
  assert.equal(isEmptySocialUrl(undefined), true);
});

test("publishBlockers: invalid social links block publishing", () => {
  const content = base();
  content.events = []; content.demoMedia.gallery = []; content.demoMedia.videos = [];
  content.social.instagram.url = "https://www.tiktok.com/@x";
  assert.deepEqual(publishBlockers(content), [{ section: "social", text: "Instagram: Link prüfen" }]);
});

test("publishBlockers: a photo tile needs a German title", () => {
  const content = base();
  content.events = []; content.demoMedia.gallery = []; content.demoMedia.videos = [];
  content.storyTiles = [{ ...content.storyTiles[0], title: { de: "", en: "" } }, content.storyTiles[1]];
  assert.deepEqual(publishBlockers(content), [{ section: "startseite", text: "Fotokachel 1: Titel fehlt" }]);
  content.storyTiles = [];
  assert.deepEqual(publishBlockers(content), []);
});

test("an empty tile list is valid and stays empty on the server", () => {
  const content = base();
  content.storyTiles = [];
  assert.deepEqual(validateMarketingContent(content).storyTiles, []);
});
