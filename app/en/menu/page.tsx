import type {Metadata} from "next";import {env} from "cloudflare:workers";import {MenuContent} from "../../menu/page";import {getSeoContent} from "../../../lib/seo-content.ts";
import {localeAlternates} from "../../../lib/seo";
export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.menu;return{title:page.title.en,description:page.description.en,alternates:localeAlternates("/menu","/en/menu","en"),openGraph:{title:page.title.en,description:page.description.en,url:"/en/menu",locale:"en_GB",alternateLocale:["de_DE"],siteName:"Bailamos Waldcafé"}}}
export default function EnglishMenu(){return <MenuContent locale="en"/>}
