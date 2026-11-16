// Opening date rules and the one price format. Run: npm run test:opening-state
import { test } from "node:test";
import assert from "node:assert/strict";
import { OPENING_DATE, isBeforeOpening, firstBookableDay, openingDayLabel, openingHoursPrefix } from "../lib/opening-state.ts";
import { formatPrice } from "../lib/price.ts";

test("the opening date is 25 November 2026", () => {
  assert.equal(OPENING_DATE, "2026-11-25");
});

test("before opening, the booking form starts on the opening day", () => {
  assert.equal(isBeforeOpening("2026-11-16"), true);
  assert.equal(firstBookableDay("2026-11-16"), "2026-11-25");
});

test("from the opening day on, the first bookable day is today", () => {
  assert.equal(isBeforeOpening("2026-11-25"), false);
  assert.equal(firstBookableDay("2026-11-25"), "2026-11-25");
  assert.equal(firstBookableDay("2026-12-03"), "2026-12-03");
});

test("labels and hours prefixes", () => {
  assert.equal(openingDayLabel("en"), "25 November");
  assert.equal(openingDayLabel("de"), "25. November");
  assert.equal(openingHoursPrefix("2026-11-16", "en"), "From 25 November: ");
  assert.equal(openingHoursPrefix("2026-11-16", "de"), "Ab 25. November: ");
  assert.equal(openingHoursPrefix("2026-12-03", "en"), "");
});

test("one price format: EN €5.90, DE 5,90 €", () => {
  assert.equal(formatPrice(5.9, "en"), "€5.90");
  assert.equal(formatPrice(5.9, "de"), "5,90 €");
  assert.equal(formatPrice(19.5, "de"), "19,50 €");
  assert.equal(formatPrice(19.5, "en"), "€19.50");
});
