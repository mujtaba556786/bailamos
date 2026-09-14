import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { getSeoContent } from "../../lib/seo-content.ts";
export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.reservation;return{title:page.title,description:page.description,alternates:{canonical:"/reservieren"},openGraph:{title:page.title,description:page.description,url:"/reservieren"}}}
export default function ReservationLayout({children}:{children:React.ReactNode}){return children}
