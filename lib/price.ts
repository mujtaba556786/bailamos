// One price format for the whole site: EN "€5.90", DE "5,90 €".
export function formatPrice(value: number, locale: "de" | "en") {
  if (locale === "en") return `€${value.toFixed(2)}`;
  return `${value.toFixed(2).replace(".", ",")} €`;
}
