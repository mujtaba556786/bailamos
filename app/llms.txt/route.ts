import { env } from "cloudflare:workers";
import { getMarketingContent } from "../../lib/marketing-content.ts";
import { getMenuContent } from "../../lib/menu-content.ts";
import { openingActive } from "../../lib/opening.ts";
import { getOperations } from "../../lib/operations-config.ts";
import { getSiteUrl } from "../../lib/site-url";
import { dishPath } from "../../lib/seo";

// llms.txt is a plain-text summary for AI assistants. It only repeats facts that are also on the website.
// Before opening, phone, hours and menu are still placeholders, so only confirmed facts are listed.
export async function GET() {
  const [{ content: menu }, { content: marketing }, { config }] = await Promise.all([
    getMenuContent(env.DB),
    getMarketingContent(env.DB),
    getOperations(env.DB),
  ]);
  const r = config.restaurant;
  const text = (body: string) => new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });

  if (openingActive(marketing.opening)) {
    const date = marketing.opening.openingDate ? `Eröffnung am ${marketing.opening.openingDate}.` : "Eröffnung demnächst; der genaue Termin wird auf der Website bekanntgegeben.";
    return text(`# Bailamos Waldcafé

Bailamos Waldcafé ist ein mexikanisches Restaurant und eine Cocktailbar in Brandenburg an der Havel (${r.contact.address}). ${date}

## Verifizierbare Kontaktdaten
- Adresse: ${r.contact.address}
- E-Mail: ${r.contact.email}
- Website: ${getSiteUrl("/opening")}
- TikTok: https://www.tiktok.com/@bailamos.waldcafe
- YouTube: https://www.youtube.com/channel/UCOix77VvOuExvfUWhey8sWw

## Noch nicht verfügbar
Telefonnummer, Öffnungszeiten, Speisekarte und Online-Reservierung werden zur Eröffnung veröffentlicht.
`);
  }

  const dayNames: Record<string, string> = { monday: "Montag", tuesday: "Dienstag", wednesday: "Mittwoch", thursday: "Donnerstag", friday: "Freitag", saturday: "Samstag", sunday: "Sonntag" };
  const hours = Object.entries(r.openingHours)
    .map(([day, value]) => `- ${dayNames[day] ?? day}: ${value === "closed" ? "geschlossen" : `${value} Uhr`}`)
    .join("\n");
  const dishes = menu.dishes.filter((dish) => dish.available);
  const dishLines = menu.categories
    .map((category) => {
      const items = dishes.filter((dish) => dish.categoryId === category.id);
      if (!items.length) return "";
      return `### ${category.name.de}\n${items
        .map((dish) => `- [${dish.name.de}](${getSiteUrl(dishPath(dish.id, "de"))}) · [English](${getSiteUrl(dishPath(dish.id, "en"))}): €${dish.price.toFixed(2)}. ${dish.description.de}`)
        .join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
  const events = marketing.events.filter((event) => event.published).map((event) => `- ${event.date} ${event.time}: ${event.title.de} — ${event.summary.de}`).join("\n") || "- Keine veröffentlichten Events.";

  return text(`# Bailamos Waldcafé

Bailamos Waldcafé (${r.legalName}) ist ein mexikanisches Restaurant und eine Cocktailbar in Brandenburg an der Havel. Die Website gibt es auf Deutsch (${getSiteUrl("/")}) und Englisch (${getSiteUrl("/en")}).

## Kontakt und Lage
- Adresse: ${r.contact.address}
- Telefon: ${r.contact.phone}
- E-Mail: ${r.contact.email}
- Tisch reservieren: ${getSiteUrl("/reservieren")} (English: ${getSiteUrl("/en/reservieren")})
- Speisekarte: ${getSiteUrl("/menu")} (English: ${getSiteUrl("/en/menu")})

## Öffnungszeiten
${hours}

## Speisekarte
Jedes Gericht hat eine eigene Seite mit Beschreibung, Preis und Allergencodes. Die Codes entsprechen der Speisekarte; bei Allergien bitte vor der Bestellung das Team fragen.

${dishLines}

## Veröffentlichte Events
${events}
`);
}
