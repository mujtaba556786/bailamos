import {localeAlternates} from "../../lib/seo";
import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { getSeoContent } from "../../lib/seo-content.ts";
export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.reservation;return{title:page.title.de,description:page.description.de,alternates:localeAlternates("/reservieren","/en/reservieren","de"),openGraph:{title:page.title.de,description:page.description.de,url:"/reservieren"}}}
export default function ReservationLayout({children}:{children:React.ReactNode}){return children}
