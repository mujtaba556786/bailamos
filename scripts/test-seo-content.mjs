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
  assert.equal(openingHoursSentence(daily, "de"), "Täglich 12:00–22:00 Uhr.");
  assert.equal(openingHoursSentence(daily, "en"), "Every day, 12:00–22:00.");
  assert.equal(openingHoursSentence({ ...daily, monday: "closed", tuesday: "closed", wednesday: "closed", thursday: "closed", friday: "closed", saturday: "closed", sunday: "closed" }, "de"), "Mo–So geschlossen.");
});

test("FAQ and group rule use only the configured facts", () => {
  const r = defaultOperations.restaurant;
  assert.equal(displayPhone("+491738609300"), "+49 173 8609300");
  assert.equal(groupRule(r, "de"), "Für Gruppen über 6 Personen schreiben Sie uns bitte per E-Mail an info@bailamos-waldcafe.de oder rufen Sie uns an unter +49 173 8609300.");
  const faq = homeFaq(r, "en"), de = homeFaq(r, "de");
  assert.equal(faq.length, 3);
  assert.equal(de.length, 3);
  assert.equal(faq[0].answer, "Book online in under a minute: pick date, time and party size, then add your contact details. We'll confirm your request.");
  assert.deepEqual(faq[0].actions, [
    { kind: "primary", href: "/en/reservieren", label: "Reserve a table" },
    { kind: "secondary", href: "tel:+491738609300", label: "Call +49 173 8609300" },
  ]);
  assert.equal(de[0].actions[0].href, "/reservieren");
  assert.equal(de[0].actions[1].label, "Anrufen: +49 173 8609300");
  // Group answer: plain text for the structured data, tappable email and phone in the visible answer.
  assert.equal(faq[1].answer, "Yes — for groups of more than 6, contact us directly so we can prepare the right table: info@bailamos-waldcafe.de or +49 173 8609300.");
  assert.deepEqual(faq[1].parts.filter((part) => typeof part !== "string"), [{ href: "mailto:info@bailamos-waldcafe.de", label: "info@bailamos-waldcafe.de" }, { href: "tel:+491738609300", label: "+49 173 8609300" }]);
  assert.match(de[1].answer, /^Ja – für Gruppen über 6 Personen kontaktieren Sie uns bitte direkt/);
  assert.equal(faq[2].answer, openingHoursSentence(r.openingHours, "en"));
  assert.equal(de[2].answer, openingHoursSentence(r.openingHours, "de"));
  for (const item of [...faq, ...de]) assert.doesNotMatch(item.answer, /€|EUR|Bewertung|review|\d\.\d Sterne|stars/i);
  assert.equal(bookingSteps("de").length, 3);
  assert.match(bookingSteps("en")[2], /restaurant accepts/);
  const ld = faqJsonLd(faq);
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity[1].acceptedAnswer.text, faq[1].answer);
});
