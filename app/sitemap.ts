import type { MetadataRoute } from "next";
import { env } from "cloudflare:workers";
import { getMarketingContent } from "../lib/marketing-content.ts";
import { getMenuContent } from "../lib/menu-content.ts";
import { openingActive } from "../lib/opening.ts";
import { getSiteUrl } from "../lib/site-url";
import { dishPath } from "../lib/seo";

// While the opening page is active every other route redirects to it, so only /opening is listed.
// Otherwise each German URL is listed with its English twin and both point at each other (hreflang),
// and every dish has its own German and English page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (openingActive((await getMarketingContent(env.DB)).content.opening)) {
    return [{ url: getSiteUrl("/opening").toString(), changeFrequency: "weekly", priority: 1 }];
  }
  const { content } = await getMenuContent(env.DB);
  const pairs: Array<{ de: string; en: string; priority: number }> = [
    { de: "/", en: "/en", priority: 1 },
    { de: "/menu", en: "/en/menu", priority: 0.9 },
    { de: "/reservieren", en: "/en/reservieren", priority: 0.9 },
    { de: "/events", en: "/en/events", priority: 0.8 },
    ...content.dishes.map((dish) => ({ de: dishPath(dish.id, "de"), en: dishPath(dish.id, "en"), priority: 0.7 })),
  ];
  return pairs.flatMap(({ de, en, priority }) => {
    const alternates = {
      languages: {
        de: getSiteUrl(de).toString(),
        en: getSiteUrl(en).toString(),
        "x-default": getSiteUrl(de).toString(),
      },
    };
    return [
      { url: getSiteUrl(de).toString(), changeFrequency: "weekly" as const, priority, alternates },
      { url: getSiteUrl(en).toString(), changeFrequency: "weekly" as const, priority, alternates },
    ];
  });
}
