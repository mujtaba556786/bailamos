import type { MetadataRoute } from "next";
import { env } from "cloudflare:workers";
import { getMenuContent } from "../lib/menu-content.ts";
import { getSiteUrl } from "../lib/site-url";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const {content}=await getMenuContent(env.DB);return[{url:getSiteUrl().toString(),changeFrequency:"weekly",priority:1},{url:getSiteUrl("/menu").toString(),changeFrequency:"weekly",priority:.9},...content.dishes.map(dish=>({url:getSiteUrl(`/menu/${dish.id}`).toString(),changeFrequency:"weekly" as const,priority:.7})),{url:getSiteUrl("/events").toString(),changeFrequency:"weekly",priority:.8},{url:getSiteUrl("/reservieren").toString(),changeFrequency:"monthly",priority:.9}]}
