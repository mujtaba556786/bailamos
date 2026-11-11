import {localeAlternates} from "../../../lib/seo";
import type {Metadata} from "next";import {env} from "cloudflare:workers";import {ReservationExperience} from "../../reservieren/page";import {getSeoContent} from "../../../lib/seo-content.ts";
export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.reservation;return{title:page.title.en,description:page.description.en,alternates:localeAlternates("/reservieren","/en/reservieren","en"),openGraph:{title:page.title.en,description:page.description.en,url:"/en/reservieren",locale:"en_GB"}}}
export default function EnglishReservation(){return <ReservationExperience locale="en"/>}
