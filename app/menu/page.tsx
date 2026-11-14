import Image from "next/image";
import { env } from "cloudflare:workers";
import { ArrowRight, Leaf, Flame as Pepper } from "lucide-react";
import { getMenuContent } from "../../lib/menu-content.ts";
import { SiteHeader } from "../../components/site-header";
import { Footer } from "../../components/footer";
import type { Metadata } from "next";
import { StructuredData } from "../../components/structured-data";
import { localeAlternates, menuJsonLd } from "../../lib/seo";
import { getSeoContent } from "../../lib/seo-content.ts";import {brandTitle} from "../../lib/page-title";
import { getMarketingContent } from "../../lib/marketing-content.ts";
import { berlinDate } from "../../lib/booking-policy.ts";
import { localized,withLocale,type Locale } from "../../lib/i18n";

export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.menu,title=brandTitle(page.title.de);return{title:{absolute:title},description:page.description.de,alternates:localeAlternates("/menu","/en/menu","de"),openGraph:{title,description:page.description.de,url:"/menu",locale:"de_DE",alternateLocale:["en_GB"],siteName:"Bailamos Waldcafé"}}}

export async function MenuContent({locale}:{locale:Locale}){
  const copy=locale==="en"?{eyebrow:"Tradition. Refinement. Mexico at heart.",title:"Menu",intro:"Classic flavours, a modern touch and ingredients treated with respect.",dishes:"dishes",unavailable:"Unavailable today",details:"Details",cta:"Found your favourite?",reserve:"Reserve a table"}:{eyebrow:"Tradition. Raffinesse. Mexiko im Herzen.",title:"Speisekarte",intro:"Klassische Aromen, moderne Handschrift und Zutaten, die wir mit Respekt behandeln.",dishes:"Gerichte",unavailable:"Heute nicht verfügbar",details:"Details",cta:"Ihr Liebling schon gefunden?",reserve:"Tisch reservieren"};
  const {content:menu}=await getMenuContent(env.DB);
  const {content:marketing}=await getMarketingContent(env.DB),today=berlinDate();
  const upcoming=marketing.events.filter(event=>event.published&&event.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];
  return <><main className="min-h-screen bg-[#fff8ec] text-[#10261e]">
    <StructuredData data={menuJsonLd(menu, locale)}/>
    <SiteHeader active="Speisekarte" locale={locale}/>
    <section className="border-b border-[#c68a3b]/25 px-5 py-16 text-center sm:px-10"><p className="eyebrow">{copy.eyebrow}</p><h1 className="font-display mt-3 text-6xl sm:text-7xl">{copy.title}</h1><p className="mx-auto mt-5 max-w-2xl text-[#10261e]/60">{copy.intro}</p></section>
    {upcoming&&<section className="px-5 pt-10 sm:px-10"><a href={withLocale(`/events#event-${upcoming.id}`,locale)} className="mx-auto flex max-w-7xl flex-col gap-3 rounded-2xl bg-[#10261e] p-6 text-[#f5e8d3] transition hover:opacity-95 sm:flex-row sm:items-center sm:justify-between sm:p-8"><span><span className="block text-xs font-bold uppercase tracking-[.15em] text-[#efc67e]">{locale==="en"?"Upcoming event":"Kommendes Event"}</span><span className="font-display mt-2 block text-3xl">{localized(upcoming.title,locale)}</span><span className="mt-2 block text-sm text-[#f5e8d3]/70">{new Date(upcoming.date).toLocaleDateString(locale==="en"?"en-GB":"de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})} · {upcoming.time}{locale==="en"?"":" Uhr"}</span></span><span className="flex items-center gap-2 text-sm font-semibold text-[#efc67e]">{locale==="en"?"See the event":"Zum Event"} <ArrowRight size={16}/></span></a></section>}
    <div className="sticky top-0 z-10 overflow-x-auto border-b border-[#c68a3b]/20 bg-[#fff8ec]/95 px-5 py-4 backdrop-blur"><div className="mx-auto flex w-max max-w-7xl gap-5">{menu.categories.map(category=><a key={category.id} href={`#${category.id}`} className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center text-xs font-semibold leading-tight text-[#10261e]"><span className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#c68a3b]/50 bg-[#10261e]/10 transition group-hover:border-[#a52520]">{category.image&&<Image src={category.image} alt="" fill className="object-cover" sizes="80px"/>}</span><span>{localized(category.name,locale)}</span></a>)}</div></div>
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-10">{menu.categories.map(category=>{
      const dishes=menu.dishes.filter(dish=>dish.categoryId===category.id);
      return <section id={category.id} key={category.id} className="mb-20 scroll-mt-24"><div className="mb-7 flex items-end justify-between border-b border-[#c68a3b]/35 pb-4"><h2 className="font-display text-4xl">{localized(category.name,locale)}</h2><span className="text-sm text-[#10261e]/45">{dishes.length} {copy.dishes}</span></div><div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">{dishes.map(dish=><a key={dish.id} href={withLocale(`/menu/${dish.id}`,locale)} aria-label={`${localized(dish.name,locale)} – ${copy.details}`} className={`group block overflow-hidden rounded-2xl bg-white shadow-[0_15px_50px_rgba(16,38,30,.09)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(16,38,30,.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a52520]/35 ${dish.available?"":"opacity-60"}`}><article><div className="relative aspect-[4/3] overflow-hidden"><Image src={dish.image} alt={localized(dish.name,locale)} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="33vw"/></div><div className="p-6"><div className="flex items-start justify-between gap-4"><h3 className="font-display text-2xl">{localized(dish.name,locale)}</h3><span className="text-right"><strong>€ {dish.price.toFixed(2).replace(".",",")}</strong>{!dish.available&&<small className="mt-1 block text-[#a52520]">{copy.unavailable}</small>}</span></div><p className="mt-3 min-h-12 text-sm leading-6 text-[#10261e]/60">{localized(dish.description,locale)}</p><div className="mt-5 flex items-center justify-between"><span className="flex gap-2 text-[#59705f]">{dish.vegetarian?<Leaf size={17}/>:null}{dish.spicy?<Pepper size={17}/>:null}</span><span className="flex items-center gap-2 text-sm font-semibold text-[#a52520]">{copy.details} <ArrowRight size={16}/></span></div></div></article></a>)}</div></section>
    })}</div>
    <section className="bg-[#10261e] px-5 py-16 text-center text-[#f5e8d3]"><h2 className="font-display text-4xl">{copy.cta}</h2><a href={withLocale("/reservieren",locale)} className="button-primary mt-7">{copy.reserve} <ArrowRight size={17}/></a></section>
  </main>
  <Footer lang={locale} />
  </>;
}
export default function MenuPage(){return <MenuContent locale="de"/>}
