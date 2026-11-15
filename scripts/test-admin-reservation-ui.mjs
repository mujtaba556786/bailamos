// Display helpers of the admin "Reservierungen" tab. Run: npm run test:admin-reservations-ui
import { test } from "node:test";
import assert from "node:assert/strict";
import { STATUS_LABELS, STATUS_TONES, contrastRatio, dayLabel, agoLabel, guestsLabel, telHref, filterChips, waitingLabel, occasionLabel, dietaryLabel } from "../lib/admin-reservation-ui.ts";

test("every status badge has at least 4.5:1 contrast and its own colour", () => {
  for (const [status, tone] of Object.entries(STATUS_TONES)) {
    assert.ok(contrastRatio(tone.text, tone.background) >= 4.5, `${status}: ${contrastRatio(tone.text, tone.background).toFixed(2)}`);
    assert.equal(tone.className, `bg-[${tone.background}] text-[${tone.text}]`);
  }
  assert.equal(new Set(Object.values(STATUS_TONES).map((tone) => tone.background)).size, Object.keys(STATUS_TONES).length);
  assert.deepEqual(Object.keys(STATUS_TONES).sort(), Object.keys(STATUS_LABELS).sort());
  assert.equal(STATUS_LABELS.pending, "Offen");
  assert.equal(contrastRatio("#000000", "#FFFFFF").toFixed(0), "21");
  assert.equal(contrastRatio("#FFFFFF", "#000000").toFixed(0), "21");
});

test("day label shows Heute or weekday and date", () => {
  assert.equal(dayLabel("2026-11-15", "2026-11-15"), "Heute");
  assert.equal(dayLabel("2026-11-21", "2026-11-15"), "Sa 21.11.");
  assert.equal(dayLabel("2026-12-01", "2026-11-15"), "Di 01.12.");
});

test("request age reads naturally", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  assert.equal(agoLabel("2026-11-15T11:59:40Z", now), "gerade eben");
  assert.equal(agoLabel("2026-11-15T12:00:30Z", now), "gerade eben");
  assert.equal(agoLabel("2026-11-15T11:48:00Z", now), "vor 12 Min.");
  assert.equal(agoLabel("2026-11-15T09:00:00Z", now), "vor 3 Std.");
  assert.equal(agoLabel("2026-11-14T11:00:00Z", now), "vor 1 Tag");
  assert.equal(agoLabel("2026-11-12T11:00:00Z", now), "vor 3 Tagen");
  assert.equal(agoLabel("not a date", now), "");
  assert.match(agoLabel(new Date().toISOString()), /gerade eben/);
});

test("guests, phone link and waiting badge", () => {
  assert.equal(guestsLabel(1), "1 Gast");
  assert.equal(guestsLabel(4), "4 Gäste");
  assert.equal(telHref("+49 (173) 860-9300"), "tel:+491738609300");
  assert.equal(telHref("0151 / 234 567"), "tel:0151234567");
  assert.equal(waitingLabel(1), "1 wartet auf Antwort");
  assert.equal(waitingLabel(3), "3 warten auf Antwort");
});

test("filter chips count statuses and hide rare empty ones", () => {
  const chips = filterChips(["pending", "pending", "confirmed", "cancelled"]);
  assert.deepEqual(chips.map((chip) => `${chip.label}:${chip.count}`), ["Alle:4", "Offen:2", "Bestätigt:1", "Angekommen:0", "Abgeschlossen:0", "Storniert:1"]);
  assert.equal(chips[0].value, "");
  const withRare = filterChips(["declined", "no_show", "seated"]).map((chip) => chip.value);
  assert.deepEqual(withRare.slice(-3), ["seated", "declined", "no_show"]);
});

test("occasion and dietary codes become German words", () => {
  assert.equal(occasionLabel("birthday"), "Geburtstag");
  assert.equal(occasionLabel("anniversary"), "Jahrestag");
  assert.equal(occasionLabel(" Firmenfeier "), "Firmenfeier");
  assert.equal(occasionLabel(""), "");
  assert.equal(occasionLabel(null), "");
  assert.equal(dietaryLabel("vegetarian"), "Vegetarisch");
  assert.equal(dietaryLabel("vegan"), "Vegan");
  assert.equal(dietaryLabel(undefined), "");
});
