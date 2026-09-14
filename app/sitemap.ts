import type { MetadataRoute } from "next";
import { env } from "cloudflare:workers";
import { getMenuContent } from "../lib/menu-content.ts";
import { getSiteUrl } from "../lib/site-url";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const {content}=await getMenuContent(env.DB),base=["","/menu","/events","/reservieren"],english=["/en","/en/menu","/en/events","/en/reservieren"];return[...base.map((path,index)=>({url:getSiteUrl(path).toString(),changeFrequency:"weekly" as const,priority:index?0.9:1})),...content.dishes.flatMap(dish=>["/menu/","/en/menu/"].map(prefix=>({url:getSiteUrl(`${prefix}${dish.id}`).toString(),changeFrequency:"weekly" as const,priority:.7}))),...english.map((path,index)=>({url:getSiteUrl(path).toString(),changeFrequency:"weekly" as const,priority:index?0.9:1}))]}
