import {localeAlternates} from "../../../lib/seo";
import type {Metadata} from "next";import {env} from "cloudflare:workers";import {EventsContent} from "../../events/page";import {getSeoContent} from "../../../lib/seo-content.ts";
export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.events;return{title:page.title.en,description:page.description.en,alternates:localeAlternates("/events","/en/events","en"),openGraph:{title:page.title.en,description:page.description.en,url:"/en/events",locale:"en_GB"}}}
export default function EnglishEvents(){return <EventsContent locale="en"/>}
