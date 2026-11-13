import Image from "next/image";
import { ArrowRight, Flame, Leaf } from "lucide-react";
import { SiteHeader } from "./site-header";
import { StructuredData } from "./structured-data";
import type { MenuContent } from "../lib/menu-content.ts";
import { localized, withLocale, type Locale } from "../lib/i18n";
import { dishBreadcrumbs, dishJsonLd, dishPath } from "../lib/seo";

// Plain <a> links on purpose: vinext's <Link> throws on click ("e is not a function"), so the buttons did nothing.
// The rest of the site uses plain links too; a full page load is fine here.
type Dish = MenuContent["dishes"][number];
type Category = MenuContent["categories"][number];

// Shared by /menu/[id] (German) and /en/menu/[id] (English). Everything shown here is also in the
// structured data, so the visible page and the markup describe the same dish.
export function DishPage({ dish, category, related, locale }: { dish: Dish; category?: Category; related: Dish[]; locale: Locale }) {
  const L = (de: string, en: string) => (locale === "en" ? en : de);
  const name = localized(dish.name, locale);
  const description = localized(dish.description, locale);
  const categoryName = category ? localized(category.name, locale) : L("Speisekarte", "Menu");
  const menuPath = withLocale("/menu", locale);
  const price = `€ ${dish.price.toFixed(2).replace(".", ",")}`;

  return (
    <main className="min-h-screen bg-[#0b1712] text-[#f5e8d3]">
      <StructuredData data={dishJsonLd(dish, locale)} />
      <StructuredData data={dishBreadcrumbs(dish, locale)} />
      <SiteHeader active="Speisekarte" locale={locale} />
      <div className="grid min-h-[calc(100vh-6rem)] lg:grid-cols-2">
        <div className="relative min-h-[48vh]">
          <Image src={dish.image} alt={name} fill className="object-cover" priority sizes="(min-width: 1024px) 50vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1712] via-transparent to-black/20" />
        </div>
        <section className="flex items-center px-7 py-14 sm:px-14 lg:px-20">
          <div className="max-w-xl">
            <nav aria-label="Breadcrumb" className="text-sm text-white/60">
              <ol className="flex flex-wrap gap-2">
                <li><a href={withLocale("/", locale)} className="hover:text-white">Bailamos Waldcafé</a> ›</li>
                <li><a href={menuPath} className="hover:text-white">{L("Speisekarte", "Menu")}</a> ›</li>
                <li aria-current="page" className="text-white/85">{name}</li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">
              <a href={`${menuPath}#${dish.categoryId}`} className="hover:underline">{categoryName}</a>
            </p>
            <h1 className="font-display mt-4 text-6xl">{name}</h1>
            <p className="mt-5 text-2xl text-[#d6a45f]">{price}</p>
            {!dish.available && (
              <p className="mt-6 inline-flex rounded-full bg-[#a52520] px-4 py-2 text-sm font-semibold">
                {L("Aktuell nicht verfügbar", "Currently unavailable")}
              </p>
            )}
            <p className="mt-8 text-lg leading-8 text-white/68">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {dish.vegetarian ? (
                <span className="rounded-full border border-[#c68a3b]/35 px-4 py-2 text-sm"><Leaf className="mr-2 inline" size={16} />{L("Vegetarisch", "Vegetarian")}</span>
              ) : null}
              {dish.spicy ? (
                <span className="rounded-full border border-[#c68a3b]/35 px-4 py-2 text-sm"><Flame className="mr-2 inline" size={16} />{L("Schärfe", "Heat")} {dish.spicy}/3</span>
              ) : null}
            </div>
            {dish.allergens.length > 0 && (
              <p className="mt-6 text-sm text-white/60">
                {L("Allergene (Codes wie auf der Speisekarte):", "Allergens (codes as listed on the menu):")}{" "}
                <span className="text-white/85">{dish.allergens.join(", ")}</span>
              </p>
            )}
            <p className="mt-3 text-sm text-white/50">
              {L("Bei Allergien oder Unverträglichkeiten fragen Sie bitte unser Team, bevor Sie bestellen.", "If you have an allergy or intolerance, please ask our team before ordering.")}
            </p>

            {related.length > 0 && (
              <div className="mt-12 border-t border-[#c68a3b]/30 pt-9">
                <h2 className="font-display text-3xl">{L("Weitere Gerichte aus", "More from")} {categoryName}</h2>
                <ul className="mt-5 grid gap-3">
                  {related.map((item) => (
                    <li key={item.id}>
                      <a href={dishPath(item.id, locale)} className="flex justify-between gap-4 rounded-xl border border-white/10 px-4 py-3 hover:border-[#c68a3b]/60">
                        <span>{localized(item.name, locale)}</span>
                        <span className="text-[#d6a45f]">€ {item.price.toFixed(2).replace(".", ",")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-12 border-t border-[#c68a3b]/30 pt-9">
              <h2 className="font-display text-3xl">{L("Dieses Gericht probieren?", "Want to try this dish?")}</h2>
              <p className="mt-2 text-white/55">
                {L("Das Gericht wird nicht vorbestellt. Wir reservieren ausschließlich Ihren Tisch.", "The dish is not pre-ordered; we reserve your table only.")}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <a href={menuPath} className="button-secondary">{L("Zur Speisekarte", "Back to menu")}</a>
                <a href={withLocale("/reservieren", locale)} className="button-primary">
                  {L("Tisch reservieren", "Reserve a table")} <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function relatedDishes(menu: MenuContent, dish: Dish) {
  return menu.dishes.filter((item) => item.categoryId === dish.categoryId && item.id !== dish.id).slice(0, 4);
}
