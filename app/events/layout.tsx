import { env } from "cloudflare:workers";
import { getMarketingContent } from "../../lib/marketing-content.ts";
import { getOperations } from "../../lib/operations-config.ts";
import { StructuredData } from "../../components/structured-data";
import { absoluteMediaUrl, getSiteUrl } from "../../lib/site-url";
export default async function EventsLayout({children}:{children:React.ReactNode}){const [{content},{config}]=await Promise.all([getMarketingContent(env.DB),getOperations(env.DB)]);return <><StructuredData data={{"@context":"https://schema.org","@graph":content.events.filter(event=>event.published).map(event=>({"@type":"Event",name:event.title.de,description:event.summary.de,startDate:`${event.date}T${event.time}:00`,eventAttendanceMode:"https://schema.org/OfflineEventAttendanceMode",eventStatus:"https://schema.org/EventScheduled",image:absoluteMediaUrl(event.image),location:{"@type":"Restaurant",name:config.restaurant.name,address:{"@type":"PostalAddress",streetAddress:config.restaurant.contact.address,addressCountry:"DE"}},offers:{"@type":"Offer",url:getSiteUrl("/reservieren").toString(),availability:"https://schema.org/InStock"}}))}}/>{children}</>}
