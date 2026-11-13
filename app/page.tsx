import Image from "next/image";
import { Fragment } from "react";
import { env } from "cloudflare:workers";
import { ArrowRight, CalendarDays, Clock3, Flame, MapPin, Users } from "lucide-react";
import { getMarketingContent } from "../lib/marketing-content.ts";
import { getMenuContent } from "../lib/menu-content.ts";
import { getOperations } from "../lib/operations-config.ts";
import { berlinDate } from "../lib/booking-policy";
import { SiteHeader } from "../components/site-header";
import { StructuredData } from "../components/structured-data";
import { HomeCarousel, type HighlightSlide } from "../components/home-carousel";
import { Footer } from "../components/footer";
import { NewsletterSignup } from "../components/newsletter-signup";
import { SocialLink } from "../components/social-link";
import { visibleSocialLinks } from "../lib/social-links";

// Background of "Aus unserem Alltag". Colour test: a deeper red blends better between the dark green sections.
// Switch back to the original accent red with "#a52520".
const ATMOSPHERE_BG = "#8f1f1b";
import { localized,withLocale,type Locale } from "../lib/i18n";
import type {Metadata} from "next";
import {getSeoContent} from "../lib/seo-content.ts";
import {restaurantJsonLd} from "../lib/seo";
import {localeAlternates} from "../lib/seo";

export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.home;return{title:page.title.de,description:page.description.de,keywords:content.keywords.de.split(",").map(x=>x.trim()),alternates:localeAlternates("/","/en","de"),openGraph:{title:page.title.de,description:page.description.de,url:"/",locale:"de_DE",alternateLocale:["en_GB"],siteName:"Bailamos Waldcafé",images:[{url:"/restaurant/terrace-exterior.jpg",alt:"Bailamos Waldcafé Terrasse"}]}}}

const weekdays=[["monday","Mo","Mon"],["tuesday","Di","Tue"],["wednesday","Mi","Wed"],["thursday","Do","Thu"],["friday","Fr","Fri"],["saturday","Sa","Sat"],["sunday","So","Sun"]] as const;

export async function HomeContent({locale}:{locale:Locale}) {
  const L=(de:string,en:string)=>locale==="en"?en:de;
  const [{content:savedMarketing},{content:menu},{config:operations}]=await Promise.all([getMarketingContent(env.DB),getMenuContent(env.DB),getOperations(env.DB)]),restaurant=operations.restaurant;
  const today=berlinDate();
  // Draft events can have no date; only published, upcoming events belong on public pages.
  const marketing={...savedMarketing,events:savedMarketing.events.filter(event=>event.published&&event.date>=today).sort((a,b)=>a.date.localeCompare(b.date))};
  // Short text for the carousel: the admin teaser, or the first sentence of the event text. Full details stay on the events page.
const carouselText=(event:{teaser?:{de:string;en:string};summary:{de:string;en:string}},locale:Locale)=>{const teaser=(event.teaser?.[locale]||"").trim();if(teaser)return teaser;const first=localized(event.summary,locale).split(/(?<=[.!?])\s/)[0];return first.length>140?first.slice(0,137)+"…":first};
const signature=menu.dishes.filter(dish=>dish.featured&&dish.available);
  // Admin choice first (Website-Inhalte); if none is chosen, the dishes marked as featured in the menu.
  const storyTiles=marketing.storyTiles.filter(tile=>tile.show);
  const storyRow1=storyTiles.slice(0,2);
  const storyRow2=storyTiles.slice(2);
  const favouritesCfg=marketing.favourites;
  const chosenFavourites=favouritesCfg.dishIds.length?favouritesCfg.dishIds.map(id=>menu.dishes.find(dish=>dish.id===id)).filter((dish):dish is NonNullable<typeof dish>=>Boolean(dish&&dish.available)):signature;
  const price=(value:number)=>new Intl.NumberFormat(locale==="en"?"en-GB":"de-DE",{style:"currency",currency:"EUR"}).format(value);
  const eventDate=(date:string,time:string)=>`${new Date(date).toLocaleDateString(locale==="en"?"en-GB":"de-DE",{weekday:"short",day:"2-digit",month:"long"})} · ${time}${locale==="de"?" Uhr":""}`;

  // Carousel order: welcome, announcement, upcoming events, then signature dishes.
  const slides:HighlightSlide[]=[
    {id:"welcome",kind:"news",label:L("Willkommen","Welcome"),title:L("Eine Nacht, die bleibt.","A night to remember."),text:L("Feuer, frische Aromen und Cocktails mit Charakter. Für lange Gespräche, große Momente und alles dazwischen.","Fire, fresh flavours and cocktails with character. For long conversations, big moments and everything in between."),image:"/restaurant/bar-interior.jpg",href:"#reservieren",cta:L("Tisch reservieren","Reserve a table")},
    ...(savedMarketing.announcement.enabled?[{id:"announcement",kind:"news" as const,label:L("Neu","New"),title:locale==="en"?savedMarketing.announcement.en:savedMarketing.announcement.de,text:"",image:"/restaurant/terrace-exterior.jpg",href:withLocale(savedMarketing.announcement.link||"/events",locale),cta:L("Mehr erfahren","Learn more")}]:[]),
    ...marketing.events.filter(event=>event.showOnHome!==false).slice(0,3).map(event=>({id:`event-${event.id}`,kind:"event" as const,label:L("Neues Event","New event"),meta:eventDate(event.date,event.time),title:localized(event.title,locale),text:carouselText(event,locale),image:event.image,href:withLocale("/events",locale),cta:L("Zum Event","See the event")})),
    ...signature.slice(0,3).map(dish=>({id:`dish-${dish.id}`,kind:"dish" as const,label:L("Neu auf der Karte","New on the menu"),meta:price(dish.price),title:localized(dish.name,locale),text:localized(dish.description,locale),image:dish.image,href:withLocale("/menu",locale),cta:L("Zur Speisekarte","See the menu")})),
  ];

  return <><main className="overflow-hidden bg-[#09130f] text-[#f5e8d3]">
    <StructuredData data={restaurantJsonLd(restaurant, visibleSocialLinks(marketing.social).map(([,url])=>url))}/>
    <SiteHeader active="Start" locale={locale}/>

    <HomeCarousel slides={slides} labels={{previous:L("Vorheriges Highlight","Previous highlight"),next:L("Nächstes Highlight","Next highlight"),pause:L("Automatisches Weiterblättern anhalten","Pause slideshow"),play:L("Automatisches Weiterblättern starten","Play slideshow"),region:L("Neuigkeiten bei Bailamos","News at Bailamos"),slide:L("von","of")}}/>

    <section id="story" className="relative scroll-mt-24 bg-[#f4ead8] px-5 py-24 text-[#10261e] sm:px-10 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.95fr_1.05fr] lg:items-end">
        <div><p className="eyebrow">{L("Mexikanisches Restaurant & Cocktailbar in Brandenburg an der Havel","Mexican restaurant & cocktail bar in Brandenburg an der Havel")}</p><h1 className="font-display mt-4 max-w-xl text-5xl leading-[.92] sm:text-7xl">{L("Willkommen bei Bailamos.","Welcome to Bailamos.")}</h1></div>
        <p className="max-w-2xl text-lg leading-8 text-[#10261e]/65">{L("Unsere Küche verbindet das Vertraute mit dem Unerwarteten. Warme Musik, klare Drinks und Tische, die zum Bleiben einladen.","Our kitchen brings the familiar together with the unexpected. Warm music, confident drinks and tables made for staying.")}</p>
      </div>
      <div className="mx-auto mt-14 grid max-w-7xl gap-4 md:grid-cols-[1.25fr_.75fr]">
        {storyRow1.map((tile,index)=><figure key={tile.id} className={`relative m-0 overflow-hidden rounded-[2rem] ${index===0?"aspect-[16/10]":"min-h-72"}`}><Image src={tile.image} fill sizes={index===0?"(min-width:768px) 62vw, 100vw":"(min-width:768px) 38vw, 100vw"} alt={localized(tile.title,locale)} className="object-cover"/><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 p-7 text-white"><span className="font-display text-3xl">{localized(tile.title,locale)}</span>{localized(tile.text,locale)&&<span className="mt-1 block text-sm text-white/70">{localized(tile.text,locale)}</span>}</figcaption></figure>)}
      </div>
      {storyRow2.length>0&&<div className="mx-auto mt-4 grid max-w-7xl gap-4 md:grid-cols-2">
        {storyRow2.map(tile=><figure key={tile.id} className="relative m-0 aspect-[4/3] overflow-hidden rounded-[2rem]"><Image src={tile.image} fill sizes="(min-width:768px) 50vw, 100vw" alt={localized(tile.title,locale)} className="object-cover"/><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 p-7 text-white"><span className="font-display text-3xl">{localized(tile.title,locale)}</span>{localized(tile.text,locale)&&<span className="mt-1 block text-sm text-white/70">{localized(tile.text,locale)}</span>}</figcaption></figure>)}
      </div>}
</section>

    {favouritesCfg.enabled&&chosenFavourites.length>0&&<section className="bg-[#10261e] px-5 py-24 sm:px-10"><div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">{localized(favouritesCfg.eyebrow,locale)}</p><h2 className="font-display mt-3 text-4xl sm:text-5xl">{localized(favouritesCfg.heading,locale)}</h2></div><a href={withLocale("/menu",locale)} className="button-glass">{L("Ganze Speisekarte","Full menu")} <ArrowRight size={17}/></a></div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">{chosenFavourites.slice(0,3).map(dish=><a href={withLocale("/menu",locale)} key={dish.id} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"><Image src={dish.image} alt={localized(dish.name,locale)} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-[#09130f]/85 via-transparent to-transparent"/>{dish.spicy>0&&<span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-[#09130f]/60 px-3 py-1 text-xs font-semibold text-[#efc67e] backdrop-blur" aria-label={L(`Schärfe ${dish.spicy} von 3`,`Spice level ${dish.spicy} of 3`)}>{Array.from({length:dish.spicy},(_,i)=><Flame key={i} size={13}/>)}</span>}<div className="absolute inset-x-0 bottom-0 p-6"><div className="flex items-end justify-between gap-4"><h3 className="font-display text-3xl leading-none">{localized(dish.name,locale)}</h3><span className="shrink-0 font-semibold text-[#efc67e]">{price(dish.price)}</span></div></div></div>
        <p className="mt-4 text-sm leading-6 text-white/60">{localized(dish.description,locale)}</p>
      </a>)}</div>
    </div></section>}

    {marketing.events.length>0&&<section className="bg-[#09130f] px-5 py-24 sm:px-10"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">{L("Aktuell bei Bailamos","Now at Bailamos")}</p><h2 className="font-display mt-3 text-5xl">{L("Abende mit Charakter.","Evenings with character.")}</h2></div><a href={withLocale("/events",locale)} className="button-glass">{L("Alle Events","All events")} <ArrowRight size={17}/></a></div><div className="mt-10 grid gap-5 md:grid-cols-2">{marketing.events.map(event=><a href={withLocale("/events",locale)} key={event.id} className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5"><div className="relative aspect-[16/8] overflow-hidden"><Image src={event.image} alt={localized(event.title,locale)} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-[#09130f]/80 to-transparent"/></div><div className="p-6"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#efc67e]">{eventDate(event.date,event.time)}</p><h3 className="font-display mt-3 text-3xl">{localized(event.title,locale)}</h3><p className="mt-3 leading-6 text-sm text-white/60">{localized(event.summary,locale)}</p></div></a>)}</div></div></section>}

    <section id="newsletter" className="scroll-mt-24 bg-[#10261e] px-5 py-20 text-white sm:px-10"><div className="mx-auto max-w-2xl text-center"><p className="eyebrow">{L("Newsletter","Newsletter")}</p><h2 className="font-display mt-3 text-4xl">{L("Keine Veranstaltung verpassen","Never miss an event")}</h2><p className="mt-4 text-white/65">{L("Wir schreiben nur, wenn es etwas Neues gibt. Abmelden geht jederzeit.","We only write when there is something new. You can unsubscribe at any time.")}</p><div className="mt-8 text-left"><NewsletterSignup lang={locale}/></div></div></section>
    <section id="atmosphere" className="scroll-mt-24 overflow-hidden px-5 py-24 sm:px-10" style={{backgroundColor:ATMOSPHERE_BG}}><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#f4c878]">{marketing.social.tiktok.handle}</p><h2 className="font-display mt-3 text-5xl text-[#fff4e3]">{L("Aus unserem Alltag.","From our everyday life.")}</h2></div><div className="flex flex-wrap gap-3">{visibleSocialLinks(marketing.social).map(([name,url])=><SocialLink key={name} name={name} href={url} variant="outline"/>)}</div></div>{/* Photos come from the admin: Website-Inhalte → Galerie & Videos. The title is the alt text and caption. */}<div className="story-rail -mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0">{marketing.demoMedia.gallery.map((item)=><a href={item.url} target="_blank" rel="noopener noreferrer" key={item.image+item.label.de} className="group w-[72vw] max-w-[17rem] shrink-0 snap-start rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c878] focus-visible:ring-offset-4 focus-visible:ring-offset-[#8f1f1b] sm:w-64"><div className="overflow-hidden rounded-[1.75rem] shadow-[0_18px_40px_-18px_rgba(0,0,0,.6)] ring-1 ring-[#f4c878]/40"><img src={item.image} alt={localized(item.label,locale)} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"/></div><p className="mt-3 line-clamp-2 text-sm text-[#fff4e3]/85">{localized(item.label,locale)}</p></a>)}</div></div></section>

    <section id="reservieren" className="relative isolate scroll-mt-24 overflow-hidden px-5 py-24 sm:px-10 lg:py-32">
      <Image src="/samples/terrace-evening.webp" fill sizes="100vw" alt="" className="-z-10 object-cover"/>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,13,10,.94)_0%,rgba(5,13,10,.8)_45%,rgba(5,13,10,.45)_100%)]"/>
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_.9fr] lg:items-center">
        <div><p className="eyebrow">{L("Tisch reservieren","Reserve a table")}</p><h2 className="font-display mt-4 max-w-xl text-5xl leading-[.92] sm:text-7xl">{L("Ihr Tisch wartet.","Your table is waiting.")}</h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/70">{L("Wählen Sie Datum und Gästezahl. Wir zeigen Ihnen freie Zeiten und passende Tische mit Fotos.","Choose a date and party size. We will show you free times and suitable tables with photos.")}</p><p className="mt-6 flex items-center gap-2 text-sm text-white/55"><Clock3 size={16} className="text-[#efc67e]"/>{L("Größere Gruppen bitte direkt anfragen.","Larger groups please contact us directly.")} {restaurant.contact.phone}</p></div>
        <form action={withLocale("/reservieren",locale)} method="get" className="rounded-[1.75rem] border border-white/15 bg-[#0a1812]/85 p-6 backdrop-blur-md sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-white/80"><span className="flex items-center gap-2"><CalendarDays size={16} className="text-[#efc67e]"/>{L("Datum","Date")}</span><input type="date" name="date" min={today} defaultValue={today} required className="min-h-13 rounded-xl border border-white/15 bg-white/5 px-4 text-base text-[#f5e8d3] [color-scheme:dark]"/></label>
            <label className="grid gap-2 text-sm font-medium text-white/80"><span className="flex items-center gap-2"><Users size={16} className="text-[#efc67e]"/>{L("Gäste","Guests")}</span><select name="guests" defaultValue="2" className="min-h-13 rounded-xl border border-white/15 bg-[#0a1812] px-4 text-base text-[#f5e8d3]">{Array.from({length:8},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} {n===1?L("Person","person"):L("Personen","people")}</option>)}</select></label>
          </div>
          <button type="submit" className="button-primary mt-7 w-full justify-between">{L("Verfügbarkeit prüfen","Check availability")} <ArrowRight size={18}/></button>
        </form>
      </div>
    </section>

    <section id="contact" className="bg-[#09130f] px-5 py-16 sm:px-10"><div className="mx-auto grid max-w-7xl gap-8 border-y border-[#c68a3b]/25 py-12 md:grid-cols-3"><div><p className="eyebrow">{restaurant.name}</p><p className="font-display mt-3 flex gap-2 text-3xl"><MapPin size={22} className="mt-1 shrink-0 text-[#efc67e]"/>{restaurant.contact.address}</p></div><div><p className="eyebrow">{L("Öffnungszeiten","Opening hours")}</p><div className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 text-sm leading-7 text-white/65">{weekdays.map(([key,de,en])=>{const hours=restaurant.openingHours[key];return <Fragment key={key}><span>{L(de,en)}</span><span>{hours==="closed"?L("geschlossen","closed"):hours.replace("-","–")+L(" Uhr","")}</span></Fragment>})}</div></div><div><p className="eyebrow">{L("Reservierungen","Reservations")}</p><p className="mt-3 leading-7 text-white/65">{restaurant.contact.phone}<br/>{restaurant.contact.email}</p></div></div></section>
  </main>
  <Footer lang={locale} />
  </>
}
export default function Home(){return <HomeContent locale="de"/>}
