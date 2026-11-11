import type { Metadata } from "next";
import type { MenuContent } from "./menu-content.ts";
import { getSiteUrl, absoluteMediaUrl } from "./site-url";
import { localized, type Locale } from "./i18n";

// Stable schema.org @id values. They are the same on every page that describes the same entity,
// so search engines and AI systems can merge the facts into one restaurant / one dish.
export const restaurantId = () => `${getSiteUrl("/").toString()}#restaurant`;
export const menuId = (locale: Locale = "de") => `${getSiteUrl(locale === "en" ? "/en/menu" : "/menu").toString()}#menu`;
export const dishId = (id: string) => `${getSiteUrl(`/menu/${id}`).toString()}#dish`;
export const sectionId = (categoryId: string) => `${getSiteUrl("/menu").toString()}#section-${categoryId}`;

export const dishPath = (id: string, locale: Locale) => (locale === "en" ? `/en/menu/${id}` : `/menu/${id}`);

// Canonical is always the URL of the page's own language. hreflang lists both languages plus x-default (German).
export function localeAlternates(dePath: string, enPath: string, locale: Locale): Metadata["alternates"] {
  return {
    canonical: locale === "en" ? enPath : dePath,
    languages: { de: dePath, en: enPath, "x-default": dePath },
  };
}

export function breadcrumbList(items: Array<{ name: string; url: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// The MenuItem object without @context, so it can be nested inside a Menu.
function menuItemNode(dish: MenuContent["dishes"][number], locale: Locale) {
  const url = getSiteUrl(dishPath(dish.id, locale)).toString();
  return {
    "@type": "MenuItem",
    "@id": dishId(dish.id),
    name: localized(dish.name, locale),
    description: localized(dish.description, locale),
    url,
    image: absoluteMediaUrl(dish.image),
    inLanguage: locale === "en" ? "en" : "de",
    ...(dish.vegetarian ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
    offers: {
      "@type": "Offer",
      price: dish.price.toFixed(2),
      priceCurrency: "EUR",
      availability: dish.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": restaurantId() },
    },
  };
}

// Standalone dish page markup.
export function dishJsonLd(dish: MenuContent["dishes"][number], locale: Locale) {
  return { "@context": "https://schema.org", ...menuItemNode(dish, locale) };
}

export function dishBreadcrumbs(dish: MenuContent["dishes"][number], locale: Locale) {
  const menuName = locale === "en" ? "Menu" : "Speisekarte";
  return breadcrumbList([
    { name: "Bailamos Waldcafé", url: getSiteUrl(locale === "en" ? "/en" : "/").toString() },
    { name: menuName, url: getSiteUrl(locale === "en" ? "/en/menu" : "/menu").toString() },
    { name: localized(dish.name, locale), url: getSiteUrl(dishPath(dish.id, locale)).toString() },
  ]);
}

export function menuJsonLd(menu: MenuContent, locale: Locale) {
  const dishes = menu.dishes;
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": menuId(locale),
    name: locale === "en" ? "Bailamos Waldcafé menu" : "Bailamos Waldcafé Speisekarte",
    url: getSiteUrl(locale === "en" ? "/en/menu" : "/menu").toString(),
    inLanguage: locale === "en" ? "en" : "de",
    hasMenuSection: menu.categories
      .map((category) => ({
        "@type": "MenuSection",
        "@id": sectionId(category.id),
        name: localized(category.name, locale),
        hasMenuItem: dishes
          .filter((dish) => dish.categoryId === category.id)
          .map((dish) => menuItemNode(dish, locale)),
      }))
      .filter((section) => section.hasMenuItem.length > 0),
    publisher: { "@id": restaurantId() },
  };
}

const cityLine = { de: "Mexikanische Küche im Bailamos Waldcafé, Brandenburg an der Havel.", en: "Mexican food at Bailamos Waldcafé, Brandenburg an der Havel." };

export function dishMetadata(dish: MenuContent["dishes"][number], locale: Locale): Metadata {
  const name = localized(dish.name, locale);
  // Text entered in the admin menu wins; otherwise the automatic text is used.
  const title = dish.seoTitle?.[locale]?.trim() || (locale === "en" ? `${name} – Bailamos Waldcafé menu` : `${name} – Speisekarte Bailamos Waldcafé`);
  const description = dish.seoDescription?.[locale]?.trim() || `${localized(dish.description, locale)} ${cityLine[locale]}`.slice(0, 300);
  const dePath = dishPath(dish.id, "de");
  const enPath = dishPath(dish.id, "en");
  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(dePath, enPath, locale),
    twitter: { card: "summary_large_image", title, description, images: [absoluteMediaUrl(dish.image)] },
    openGraph: {
      title,
      description,
      type: "website",
      url: locale === "en" ? enPath : dePath,
      locale: locale === "en" ? "en_GB" : "de_DE",
      alternateLocale: locale === "en" ? ["de_DE"] : ["en_GB"],
      siteName: "Bailamos Waldcafé",
      images: [absoluteMediaUrl(dish.image)],
    },
  };
}

const schemaDayNames: Record<string, string> = { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" };

// Restaurant entity. Hours come from the operations config (no invented hours); the address is split into parts.
export function restaurantJsonLd(restaurant: { name: string; legalName: string; contact: { address: string; phone: string; email: string }; openingHours: Record<string, string> }, sameAs: string[]) {
  const [street = "", postal = "", ...rest] = restaurant.contact.address.split(",").map((part) => part.trim());
  const postalMatch = postal.match(/^(\d{5})\s+(.*)$/);
  const postalCode = postalMatch?.[1];
  const locality = postalMatch?.[2] ?? rest.join(", ");
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": restaurantId(),
    name: "Bailamos Waldcafé",
    legalName: restaurant.legalName,
    description: "Mexikanisches Restaurant und Cocktailbar im Bailamos Waldcafé in Brandenburg an der Havel.",
    url: getSiteUrl("/").toString(),
    image: getSiteUrl("/restaurant/terrace-exterior.jpg").toString(),
    logo: getSiteUrl("/bailamos-logo.jpg").toString(),
    telephone: restaurant.contact.phone,
    email: restaurant.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      ...(postalCode ? { postalCode } : {}),
      addressLocality: locality,
      addressCountry: "DE",
    },
    servesCuisine: ["Mexican"],
    inLanguage: ["de", "en"],
    acceptsReservations: true,
    hasMenu: { "@id": menuId("de") },
    menu: getSiteUrl("/menu").toString(),
    sameAs,
    openingHoursSpecification: Object.entries(restaurant.openingHours)
      .filter(([, hours]) => hours !== "closed")
      .map(([day, hours]) => {
        const [opens, closes] = hours.split("-");
        return { "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${schemaDayNames[day]}`, opens, closes };
      }),
    potentialAction: { "@type": "ReserveAction", target: getSiteUrl("/reservieren").toString() },
  };
}
