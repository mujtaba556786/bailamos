// Page titles, opening-hours text and FAQ facts. Run: node --test scripts/test-seo-content.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { brandTitle, TITLE_MAX } from "../lib/page-title.ts";
import { groupedOpeningHours, openingHoursSentence } from "../lib/opening-hours.ts";
import { bookingSteps, displayPhone, groupRule, homeFaq, faqJsonLd } from "../lib/guest-info.ts";
import { defaultSeo } from "../lib/seo-content.ts";
import { defaultOperations } from "../lib/operations-config.ts";
import restaurantData from "../data/restaurant.json" with { type: "json" };

test("titles end with the brand exactly once", () => {
  assert.equal(brandTitle("Speisekarte | Mexikanische Küche | Bailamos"), "Speisekarte | Mexikanische Küche | Bailamos");
  assert.equal(brandTitle("Speisekarte | Bailamos | Bailamos"), "Speisekarte | Bailamos");
  assert.equal(brandTitle("Impressum"), "Impressum | Bailamos");
  assert.equal(brandTitle("Tisch reservieren | Bailamos Brandenburg an der Havel"), "Tisch reservieren | Bailamos Brandenburg an der Havel");
  assert.equal(brandTitle("  Menu  "), "Menu | Bailamos");
  assert.equal(brandTitle(""), "Bailamos");
});

test("default SEO titles stay within 60 characters and the home text has no opening date", () => {
  for (const page of Object.values(defaultSeo.pages)) for (const lang of ["de", "en"]) assert.ok(brandTitle(page.title[lang]).length <= TITLE_MAX, page.title[lang]);
  assert.doesNotMatch(defaultSeo.pages.home.description.de + defaultSeo.pages.home.description.en, /Eröffnung|Opening|2026/);
  assert.match(defaultSeo.pages.home.description.de, /Anton-Saefkow-Allee 2A, 14772 Brandenburg an der Havel/);
});

test("opening hours are grouped from the data file", () => {
  assert.deepEqual(groupedOpeningHours(restaurantData.openingHours, "de"), [
    { days: "Mo", hours: "geschlossen" },
    { days: "Di–Do", hours: "17:00–23:00 Uhr" },
    { days: "Fr–Sa", hours: "17:00–01:00 Uhr" },
    { days: "So", hours: "17:00–22:00 Uhr" },
  ]);
  assert.equal(openingHoursSentence(restaurantData.openingHours, "en"), "Mon closed, Tue–Thu 17:00–23:00, Fri–Sat 17:00–01:00, Sun 17:00–22:00.");
  const daily = Object.fromEntries(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => [d, "12:00-22:00"]));
  assert.equal(openingHoursSentence(daily, "de"), "Mo–So 12:00–22:00 Uhr.");
});

test("FAQ and group rule use only the configured facts", () => {
  const r = defaultOperations.restaurant;
  assert.equal(displayPhone("+491738609300"), "+49 173 8609300");
  assert.equal(groupRule(r, "de"), "Für Gruppen über 6 Personen schreiben Sie uns bitte per E-Mail an info@bailamos-waldcafe.de oder rufen Sie uns an unter +49 173 8609300.");
  const faq = homeFaq(r, "en");
  assert.equal(faq.length, 3);
  assert.match(faq[0].answer, /\+49 173 8609300/);
  assert.match(faq[0].answer, /info@bailamos-waldcafe\.de/);
  assert.equal(faq[2].answer, openingHoursSentence(r.openingHours, "en"));
  for (const item of [...faq, ...homeFaq(r, "de")]) assert.doesNotMatch(item.answer, /€|EUR|Bewertung|review|\d\.\d Sterne|stars/i);
  assert.equal(bookingSteps("de").length, 3);
  assert.match(bookingSteps("en")[2], /restaurant accepts/);
  const ld = faqJsonLd(faq);
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity[1].acceptedAnswer.text, faq[1].answer);
});
