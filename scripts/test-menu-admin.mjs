// Unit tests for the Speisekarte admin helpers. Run: npm run test:menu-admin
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSearch, dishMatches, groupDishes, dishCountByCategory, moveItem, categoryOrderChanged, canDeleteCategory, formatPrice } from "../lib/menu-admin.ts";

const dish = (id, categoryId, de, descDe = "", en = de, descEn = descDe) => ({ id, categoryId, name: { de, en }, description: { de: descDe, en: descEn }, price: 5, image: "/x.jpg", featured: false, available: true, spicy: 0, allergens: [] });
const menu = () => ({
  categories: [{ id: "tacos", name: { de: "Tacos", en: "Tacos" } }, { id: "drinks", name: { de: "Getränke", en: "Drinks" } }, { id: "leer", name: { de: "Leer", en: "Empty" } }],
  dishes: [
    dish("taco-pollo", "tacos", "Taco Pollo", "Hähnchen mit Jalapeño"),
    dish("taco-veggie", "tacos", "Taco Verde", "Bohnen und Avocado", "Green taco", "Beans and avocado"),
    dish("horchata", "drinks", "Horchata", "Reisgetränk mit Zimt", "Horchata", "Rice drink with cinnamon"),
  ],
});

test("normalizeSearch removes accents and case", () => {
  assert.equal(normalizeSearch("  Jalapeño CRÈME "), "jalapeno creme");
});

test("search matches name and description in both languages", () => {
  const [pollo, veggie, horchata] = menu().dishes;
  assert.ok(dishMatches(pollo, "jalapeno"));
  assert.ok(dishMatches(veggie, "avocado"));
  assert.ok(dishMatches(horchata, "cinnamon"));
  assert.ok(dishMatches(veggie, "green bohnen"));
  assert.ok(!dishMatches(pollo, "avocado"));
  assert.ok(dishMatches(pollo, "   "));
});

test("groupDishes keeps category order and shows empty categories without a filter", () => {
  const groups = groupDishes(menu());
  assert.deepEqual(groups.map((g) => g.category.id), ["tacos", "drinks", "leer"]);
  assert.deepEqual(groups[0].dishes.map((d) => d.id), ["taco-pollo", "taco-veggie"]);
  assert.equal(groups[2].dishes.length, 0);
});

test("groupDishes hides empty groups while searching or filtering", () => {
  assert.deepEqual(groupDishes(menu(), "zimt").map((g) => g.category.id), ["drinks"]);
  assert.deepEqual(groupDishes(menu(), "", ["leer"]).map((g) => g.category.id), []);
  assert.deepEqual(groupDishes(menu(), "", ["drinks", "tacos"]).map((g) => g.category.id), ["tacos", "drinks"]);
  assert.deepEqual(groupDishes(menu(), "taco", ["drinks"]), []);
});

test("dishCountByCategory counts every category, including empty ones", () => {
  assert.deepEqual(dishCountByCategory(menu()), { tacos: 2, drinks: 1, leer: 0 });
});

test("moveItem moves items and ignores invalid moves", () => {
  assert.deepEqual(moveItem(["a", "b", "c"], 0, 2), ["b", "c", "a"]);
  assert.deepEqual(moveItem(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
  const list = ["a", "b"];
  assert.equal(moveItem(list, 0, 0), list);
  assert.equal(moveItem(list, -1, 1), list);
  assert.equal(moveItem(list, 0, 5), list);
});

test("categoryOrderChanged compares only the order of ids", () => {
  const saved = menu(), same = menu(), moved = menu();
  same.categories[0].name.de = "Anders";
  moved.categories = moveItem(moved.categories, 0, 1);
  assert.equal(categoryOrderChanged(saved, same), false);
  assert.equal(categoryOrderChanged(saved, moved), true);
  assert.equal(categoryOrderChanged(null, moved), false);
});

test("canDeleteCategory blocks non-empty and last categories and reports the dish count", () => {
  assert.deepEqual(canDeleteCategory(menu(), "leer"), { ok: true, affected: 0 });
  const full = canDeleteCategory(menu(), "tacos");
  assert.equal(full.ok, false);
  assert.equal(full.affected, 2);
  assert.match(full.reason, /2 Gerichte/);
  assert.match(canDeleteCategory(menu(), "drinks").reason, /1 Gericht\b/);
  const single = { categories: [menu().categories[2]], dishes: [] };
  assert.equal(canDeleteCategory(single, "leer").ok, false);
});

test("formatPrice uses a comma and the euro sign", () => {
  assert.equal(formatPrice(5.9), "5,90 €");
  assert.equal(formatPrice(12), "12,00 €");
});
