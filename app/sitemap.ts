import type { MetadataRoute } from "next";
import { env } from "cloudflare:workers";
import { getMarketingContent } from "../lib/marketing-content.ts";
import { getMenuContent } from "../lib/menu-content.ts";
import { openingActive } from "../lib/opening.ts";
import { getSiteUrl } from "../lib/site-url";
// While the opening page is active every other route redirects to it, so only /opening is listed.
export default async function sitemap():Promise<MetadataRoute.Sitemap>{if(openingActive((await getMarketingContent(env.DB)).content.opening))return[{url:getSiteUrl("/opening").toString(),changeFrequency:"weekly",priority:1}];const {content}=await getMenuContent(env.DB),base=["","/menu","/events","/reservieren"],english=["/en","/en/menu","/en/events","/en/reservieren"];return[...base.map((path,index)=>({url:getSiteUrl(path).toString(),changeFrequency:"weekly" as const,priority:index?0.9:1})),...content.dishes.flatMap(dish=>["/menu/","/en/menu/"].map(prefix=>({url:getSiteUrl(`${prefix}${dish.id}`).toString(),changeFrequency:"weekly" as const,priority:.7}))),...english.map((path,index)=>({url:getSiteUrl(path).toString(),changeFrequency:"weekly" as const,priority:index?0.9:1}))]}
