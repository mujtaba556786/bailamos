// Helpers for the Speisekarte admin page. No React here, so the logic can be tested on its own.
import type { MenuContent } from "./menu-content.ts";

export type MenuCategory = MenuContent["categories"][number];
export type MenuDish = MenuContent["dishes"][number];
export type DishGroup = { category: MenuCategory; dishes: MenuDish[] };

// Lower case, no accents, so "creme" finds "Crème" and "Jalapeno" finds "Jalapeño".
export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Search matches the German and English name and description. Every word of the query must match.
export function dishMatches(dish: MenuDish, query: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = normalizeSearch([dish.name.de, dish.name.en, dish.description.de, dish.description.en].join(" "));
  return words.every((word) => haystack.includes(word));
}

// Dishes grouped in category order. Categories with no matching dish are left out while a search or filter is active.
export function groupDishes(menu: MenuContent, query = "", categoryFilter: string[] = []): DishGroup[] {
  const filtering = query.trim() !== "" || categoryFilter.length > 0;
  return menu.categories
    .filter((category) => !categoryFilter.length || categoryFilter.includes(category.id))
    .map((category) => ({ category, dishes: menu.dishes.filter((dish) => dish.categoryId === category.id && dishMatches(dish, query)) }))
    .filter((group) => !filtering || group.dishes.length > 0);
}

// Number of dishes in each category, used for the chips and the delete confirmation.
export function dishCountByCategory(menu: MenuContent) {
  const counts: Record<string, number> = {};
  for (const category of menu.categories) counts[category.id] = 0;
  for (const dish of menu.dishes) counts[dish.categoryId] = (counts[dish.categoryId] ?? 0) + 1;
  return counts;
}

// Moves one item to a new position. Out-of-range moves return the same list unchanged.
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// True when the category order differs from the saved one.
export function categoryOrderChanged(saved: MenuContent | null, current: MenuContent | null) {
  if (!saved || !current) return false;
  return saved.categories.map((c) => c.id).join("|") !== current.categories.map((c) => c.id).join("|");
}

export type CategoryDeleteCheck = { ok: true; affected: number } | { ok: false; reason: string; affected: number };

// A category can only go when it is empty and not the last one. The count is shown in the confirmation.
export function canDeleteCategory(menu: MenuContent, id: string): CategoryDeleteCheck {
  const affected = menu.dishes.filter((dish) => dish.categoryId === id).length;
  if (menu.categories.length <= 1) return { ok: false, reason: "Mindestens eine Kategorie muss bestehen bleiben.", affected };
  if (affected > 0) return { ok: false, reason: `Diese Kategorie enthält ${affected} ${affected === 1 ? "Gericht" : "Gerichte"}. Bitte verschieben oder löschen Sie diese zuerst.`, affected };
  return { ok: true, affected };
}

export function formatPrice(price: number) {
  return `${price.toFixed(2).replace(".", ",")} €`;
}
