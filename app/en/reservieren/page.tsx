import {localeAlternates} from "../../../lib/seo";
import type {Metadata} from "next";import {env} from "cloudflare:workers";import {getSeoContent} from "../../../lib/seo-content.ts";
import {brandTitle} from "../../../lib/page-title";
import {ReservationExperience} from "../../../components/reservation-experience";
import {ReservationInfo} from "../../../components/reservation-info";
import {getOperations} from "../../../lib/operations-config.ts";
export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.reservation,title=brandTitle(page.title.en);return{title:{absolute:title},description:page.description.en,alternates:localeAlternates("/reservieren","/en/reservieren","en"),openGraph:{title,description:page.description.en,url:"/en/reservieren",locale:"en_GB"}}}
export default async function EnglishReservation(){const {config}=await getOperations(env.DB);return <ReservationExperience locale="en"><ReservationInfo restaurant={config.restaurant} locale="en"/></ReservationExperience>}
