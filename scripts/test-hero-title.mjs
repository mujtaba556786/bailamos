// Homepage carousel title size by length. Run: node --test scripts/test-hero-title.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { heroTitleClass } from "../lib/hero-title.ts";

test("short titles stay large, long ones get smaller in two steps", () => {
  assert.match(heroTitleClass("Tacos al Pastor"), /6\.4rem/);
  assert.match(heroTitleClass("  Noche de Mezcal · Jeden Freitag  "), /4\.6rem/);
  assert.match(heroTitleClass("Weihnachtszeit im Bailamos – den ganzen Dezember geöffnet"), /3\.6rem/);
  assert.match(heroTitleClass("x".repeat(22)), /6\.4rem/);
  assert.match(heroTitleClass("x".repeat(23)), /4\.6rem/);
  assert.match(heroTitleClass("x".repeat(41)), /3\.6rem/);
});
