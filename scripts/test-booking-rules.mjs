// Booking rules card, guest limits, {max} placeholder, blocked days, staff permissions. Run: npm run test:booking-rules
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { groupNoteText, migrateGroupNote, bookingRuleErrors, addBlockedDay, removeBlockedDay, blockedDayChips, exampleSlots, bookingSummary, staffTabsAfterSave, formatGermanDate } from "../lib/booking-rules.ts";
import { keyMayOpen, ADMIN_TABS } from "../lib/admin-tabs.ts";
import { validateOperations, saveOperations, getOperations, defaultOperations } from "../lib/operations-config.ts";

test("{max} is replaced everywhere in the note", () => {
  assert.equal(groupNoteText("Für Gruppen über {max} Personen, ab {max}+ bitte anrufen.", 6), "Für Gruppen über 6 Personen, ab 6+ bitte anrufen.");
  assert.equal(groupNoteText("Kein Platzhalter", 6), "Kein Platzhalter");
});

test("old notes migrate the written group size to {max}, phone numbers stay", () => {
  const de = "Für Gruppen über 6 Personen schreiben Sie uns bitte per E-Mail an info@bailamos-waldcafe.de oder rufen Sie uns an unter +49 173 8609300.";
  const en = "For groups of more than 6 people, please email us at info@bailamos-waldcafe.de or call us on +49 173 8609300.";
  assert.equal(migrateGroupNote(de, 6), de.replace("über 6 Personen", "über {max} Personen"));
  assert.equal(migrateGroupNote(en, 6), en.replace("more than 6 people", "more than {max} people"));
  assert.equal(migrateGroupNote("Ab 8 Gäste bitte anrufen", 8), "Ab {max} Gäste bitte anrufen");
  // A different number than the limit is left alone, and so is a note that already uses {max}.
  assert.equal(migrateGroupNote("über 10 Personen", 6), "über 10 Personen");
  assert.equal(migrateGroupNote("über {max} Personen, Tel. 6 Personen", 6), "über {max} Personen, Tel. 6 Personen");
});

test("bookingRuleErrors: form limit must not exceed the maximum; duration must fit the interval", () => {
  assert.deepEqual(bookingRuleErrors({ durationMinutes: 120, intervalMinutes: 30, maximumGuests: 10, guestSelectLimit: 6 }), {});
  assert.deepEqual(bookingRuleErrors({ durationMinutes: 120, intervalMinutes: 30, maximumGuests: 6, guestSelectLimit: 6 }), {});
  assert.match(bookingRuleErrors({ durationMinutes: 120, intervalMinutes: 30, maximumGuests: 4, guestSelectLimit: 6 }).guestSelectLimit, /\(4\)/);
  assert.match(bookingRuleErrors({ durationMinutes: 100, intervalMinutes: 30, maximumGuests: 10, guestSelectLimit: 6 }).durationMinutes, /teilbar/);
  assert.deepEqual(bookingRuleErrors({ durationMinutes: 100, intervalMinutes: 0, maximumGuests: 10, guestSelectLimit: 6 }), {});
});

test("addBlockedDay sorts, de-duplicates and stores the reason; bad dates are refused", () => {
  let state = addBlockedDay(["2026-12-31"], {}, "2026-12-24", " Heiligabend ");
  assert.deepEqual(state.dates, ["2026-12-24", "2026-12-31"]);
  assert.deepEqual(state.reasons, { "2026-12-24": "Heiligabend" });
  state = addBlockedDay(state.dates, state.reasons, "2026-12-24", "");
  assert.deepEqual(state.dates, ["2026-12-24", "2026-12-31"]);
  assert.deepEqual(state.reasons, {});
  assert.equal(addBlockedDay([], {}, "x".repeat(10)).error, "Bitte ein gültiges Datum wählen.");
  assert.equal(addBlockedDay([], {}, "2026-13-45").error, "Bitte ein gültiges Datum wählen.");
  assert.equal(addBlockedDay([], {}, "2026-01-01", "a".repeat(100)).reasons["2026-01-01"].length, 60);
});

test("removeBlockedDay removes the day and its reason", () => {
  assert.deepEqual(removeBlockedDay(["2026-12-24", "2026-12-31"], { "2026-12-31": "Silvester" }, "2026-12-31"), { dates: ["2026-12-24"], reasons: {} });
});

test("blockedDayChips: German labels with reason, sorted, past days hidden unless asked", () => {
  const dates = ["2026-12-31", "2026-01-01", "2026-11-20"], reasons = { "2026-12-31": "Silvester" };
  const hidden = blockedDayChips(dates, reasons, "2026-11-13", false);
  assert.deepEqual(hidden.visible.map((c) => c.label), ["20.11.2026", "31.12.2026 · Silvester"]);
  assert.equal(hidden.pastCount, 1);
  assert.deepEqual(blockedDayChips(dates, reasons, "2026-11-13", true).visible.map((c) => c.date), ["2026-01-01", "2026-11-20", "2026-12-31"]);
  assert.equal(formatGermanDate("2027-01-12"), "12.01.2027");
});

test("exampleSlots uses opening hours, interval and table time", () => {
  assert.deepEqual(exampleSlots("12:00-15:00", 30, 120, 3), ["12:00", "12:30", "13:00"]);
  assert.deepEqual(exampleSlots("12:00-22:00", 30, 120, 3), ["12:00", "12:30", "13:00", "13:30"]);
  assert.deepEqual(exampleSlots("17:00-19:00", 30, 120, 3), ["17:00"]);
  assert.deepEqual(exampleSlots("22:00-01:00", 60, 120, 3), ["22:00", "23:00"]);
  assert.deepEqual(exampleSlots("closed", 30, 120), []);
  assert.deepEqual(exampleSlots("12:00-15:00", 0, 120), []);
});

const hours = { monday: "closed", tuesday: "closed", wednesday: "closed", thursday: "closed", friday: "12:00-22:00", saturday: "12:00-22:00", sunday: "closed" };
const rules = { durationMinutes: 120, intervalMinutes: 30, maximumGuests: 10, guestSelectLimit: 6 };

test("bookingSummary describes what guests will see", () => {
  // 2026-11-13 is a Friday.
  assert.equal(bookingSummary({ openingHours: hours, rules, horizonDays: 60, blockedDates: ["2026-12-31", "2026-01-01"], today: "2026-11-13" }),
    "Gäste sehen: 12:00, 12:30, 13:00 … · Tisch 2 Std. belegt · bis 6 Personen online · buchbar bis 12.01.2027 · 1 gesperrter Tag");
  // On a closed day it shows the next open day; other durations and counts read naturally.
  const sunday = bookingSummary({ openingHours: hours, rules: { ...rules, durationMinutes: 90, guestSelectLimit: 1 }, horizonDays: 1, blockedDates: [], today: "2026-11-15" });
  assert.match(sunday, /^Gäste sehen \(Freitag\): 12:00/);
  assert.match(sunday, /Tisch 1 Std\. 30 Min\. belegt · bis 1 Person online · buchbar bis 16\.11\.2026 · 0 gesperrte Tage$/);
  assert.match(bookingSummary({ openingHours: hours, rules: { ...rules, durationMinutes: 45, intervalMinutes: 15 }, horizonDays: 1, blockedDates: [], today: "2026-11-13" }), /Tisch 45 Min\. belegt/);
  assert.match(bookingSummary({ openingHours: Object.fromEntries(Object.keys(hours).map((d) => [d, "closed"])), rules, horizonDays: 1, blockedDates: ["2026-11-20", "2026-11-21"], today: "2026-11-13" }), /^Keine Startzeiten .* · 2 gesperrte Tage$/);
});

test("server-side permission rule: admin opens everything, staff only ticked areas", () => {
  assert.equal(keyMayOpen("admin", [], ["operations"]), true);
  assert.equal(keyMayOpen("staff", ["reservations"], ["reservations", "statistics"]), true);
  assert.equal(keyMayOpen("staff", ["reservations"], ["operations"]), false);
  assert.equal(keyMayOpen("staff", [], ["menu"]), false);
  for (const tab of ADMIN_TABS) assert.equal(keyMayOpen("staff", [tab], [tab]), true);
});

test("staff cannot change staff permissions when saving settings", () => {
  assert.deepEqual(staffTabsAfterSave("admin", ["menu"], ["reservations"]), ["menu"]);
  assert.deepEqual(staffTabsAfterSave("staff", [...ADMIN_TABS], ["reservations"]), ["reservations"]);
});

const base = () => structuredClone(defaultOperations);

test("validateOperations keeps reasons only for listed days and migrates old notes", () => {
  const config = base();
  config.restaurant.reservation.blockedDates = ["2026-12-31"];
  config.restaurant.reservation.blockedReasons = { "2026-12-31": "  Silvester ", "2027-01-01": "nicht gelistet", bad: 5 };
  config.restaurant.reservation.largeGroupNote = { de: "Ab 6 Personen bitte anrufen.", en: "More than 6 people: please call." };
  const clean = validateOperations(config);
  assert.deepEqual(clean.restaurant.reservation.blockedReasons, { "2026-12-31": "Silvester" });
  assert.equal(clean.restaurant.reservation.largeGroupNote.de, "Ab {max} Personen bitte anrufen.");
  assert.equal(clean.restaurant.reservation.largeGroupNote.en, "More than {max} people: please call.");
  // Stored data without reasons still loads (backward compatible).
  delete config.restaurant.reservation.blockedReasons;
  assert.deepEqual(validateOperations(config).restaurant.reservation.blockedReasons, {});
  config.restaurant.reservation.blockedReasons = ["x"];
  assert.deepEqual(validateOperations(config).restaurant.reservation.blockedReasons, {});
});

test("loading never fails on a form limit above the maximum (only saving refuses it)", () => {
  const config = base();
  config.restaurant.reservation.maximumGuests = 4;
  config.restaurant.reservation.guestSelectLimit = 6;
  assert.equal(validateOperations(config).restaurant.reservation.guestSelectLimit, 6);
});

const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', d1Databases: ["DB"] });
after(() => mf.dispose());
let ready;
const database = () => (ready ??= (async () => {
  const db = await mf.getD1Database("DB");
  for (const file of (await readdir(new URL("../drizzle/", import.meta.url))).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((value) => value.trim())) await db.prepare(statement).run();
  }
  return db;
})());

test("saving refuses a form limit above the maximum and keeps reasons", async () => {
  const db = await database();
  const bad = base();
  bad.restaurant.reservation.maximumGuests = 4;
  bad.restaurant.reservation.guestSelectLimit = 6;
  await assert.rejects(saveOperations(db, bad, 0), { code: "INVALID_CONFIG" });
  const good = base();
  good.restaurant.reservation.blockedDates = ["2026-12-31"];
  good.restaurant.reservation.blockedReasons = { "2026-12-31": "Silvester" };
  const saved = await saveOperations(db, good, 0);
  assert.equal(saved.version, 1);
  const loaded = await getOperations(db);
  assert.deepEqual(loaded.config.restaurant.reservation.blockedReasons, { "2026-12-31": "Silvester" });
  assert.match(loaded.config.restaurant.reservation.largeGroupNote.de, /\{max\}/);
});
