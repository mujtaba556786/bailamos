import {localeAlternates} from "../../../lib/seo";
import type {Metadata} from "next";import {env} from "cloudflare:workers";import {EventsContent} from "../../events/page";import {getSeoContent} from "../../../lib/seo-content.ts";import {brandTitle} from "../../../lib/page-title";
export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.events,title=brandTitle(page.title.en);return{title:{absolute:title},description:page.description.en,alternates:localeAlternates("/events","/en/events","en"),openGraph:{title,description:page.description.en,url:"/en/events",locale:"en_GB"}}}
export default function EnglishEvents(){return <EventsContent locale="en"/>}
