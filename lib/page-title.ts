// Page titles end with the brand exactly once. Saved SEO titles often already say "… | Bailamos";
// the layout used to add it again ("… | Bailamos | Bailamos"). Pages pass the result as { absolute }.
export const BRAND = "Bailamos";
export const BRAND_SUFFIX = ` | ${BRAND}`;
// Google shows about 60 characters; the admin warns above this.
export const TITLE_MAX = 60;

export function brandTitle(raw: string) {
  let title = raw.replace(/\s+/g, " ").trim();
  // Drop doubled endings like "… | Bailamos | Bailamos" until one is left.
  while (title.endsWith(BRAND_SUFFIX) && title.slice(0, -BRAND_SUFFIX.length).includes(BRAND)) title = title.slice(0, -BRAND_SUFFIX.length).trim();
  if (!title) return BRAND;
  return title.includes(BRAND) ? title : `${title}${BRAND_SUFFIX}`;
}
