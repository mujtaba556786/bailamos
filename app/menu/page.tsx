import Image from "next/image";
import Link from "next/link";
import { env } from "cloudflare:workers";
import { ArrowRight, Leaf, Flame as Pepper } from "lucide-react";
import { getMenuContent } from "../../lib/menu-content.ts";
import { SiteHeader } from "../../components/site-header";
import type { Metadata } from "next";
import { StructuredData } from "../../components/structured-data";
import { absoluteMediaUrl, getSiteUrl } from "../../lib/site-url";
import { getSeoContent } from "../../lib/seo-content.ts";
import { localized,withLocale,type Locale } from "../../lib/i18n";

export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.menu;return{title:page.title.de,description:page.description.de,alternates:{canonical:"/menu",languages:{de:"/menu",en:"/en/menu"}},openGraph:{title:page.title.de,description:page.description.de,url:"/menu",locale:"de_DE"}}}

export async function MenuContent({locale}:{locale:Locale}){
  const copy=locale==="en"?{eyebrow:"Tradition. Refinement. Mexico at heart.",title:"Menu",intro:"Classic flavours, a modern touch and ingredients treated with respect.",dishes:"dishes",unavailable:"Unavailable today",details:"Details",cta:"Found your favourite?",reserve:"Reserve a table"}:{eyebrow:"Tradition. Raffinesse. Mexiko im Herzen.",title:"Speisekarte",intro:"Klassische Aromen, moderne Handschrift und Zutaten, die wir mit Respekt behandeln.",dishes:"Gerichte",unavailable:"Heute nicht verfügbar",details:"Details",cta:"Ihr Liebling schon gefunden?",reserve:"Tisch reservieren"};
  const {content:menu}=await getMenuContent(env.DB);
  return <main className="min-h-screen bg-[#fff8ec] text-[#10261e]">
    <StructuredData data={{"@context":"https://schema.org","@type":"Menu","@id":`${getSiteUrl("/menu")}#menu`,name:"Bailamos Speisekarte",url:getSiteUrl("/menu").toString(),hasMenuSection:menu.categories.map(category=>({"@type":"MenuSection",name:category.name.de,hasMenuItem:menu.dishes.filter(dish=>dish.categoryId===category.id).map(dish=>({"@type":"MenuItem",name:dish.name.de,description:dish.description.de,image:absoluteMediaUrl(dish.image),offers:{"@type":"Offer",price:dish.price.toFixed(2),priceCurrency:"EUR",availability:`https://schema.org/${dish.available?"InStock":"OutOfStock"}`}}))}))}}/>
    <SiteHeader active="Speisekarte" locale={locale}/>
    <section className="border-b border-[#c68a3b]/25 px-5 py-16 text-center sm:px-10"><p className="eyebrow">{copy.eyebrow}</p><h1 className="font-display mt-3 text-6xl sm:text-7xl">{copy.title}</h1><p className="mx-auto mt-5 max-w-2xl text-[#10261e]/60">{copy.intro}</p></section>
    <div className="sticky top-0 z-10 overflow-x-auto border-b border-[#c68a3b]/20 bg-[#fff8ec]/95 px-5 py-4 backdrop-blur"><div className="mx-auto flex w-max max-w-7xl gap-3">{menu.categories.map(category=><a key={category.id} href={`#${category.id}`} className="rounded-full border border-[#10261e]/15 px-5 py-2 text-sm hover:bg-[#10261e] hover:text-white">{localized(category.name,locale)}</a>)}</div></div>
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-10">{menu.categories.map(category=>{
      const dishes=menu.dishes.filter(dish=>dish.categoryId===category.id);
      return <section id={category.id} key={category.id} className="mb-20 scroll-mt-24"><div className="mb-7 flex items-end justify-between border-b border-[#c68a3b]/35 pb-4"><h2 className="font-display text-4xl">{localized(category.name,locale)}</h2><span className="text-sm text-[#10261e]/45">{dishes.length} {copy.dishes}</span></div><div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">{dishes.map(dish=><article key={dish.id} className={`group overflow-hidden rounded-2xl bg-white shadow-[0_15px_50px_rgba(16,38,30,.09)] ${dish.available?"":"opacity-60"}`}><div className="relative aspect-[4/3] overflow-hidden"><Image src={dish.image} alt={localized(dish.name,locale)} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="33vw"/></div><div className="p-6"><div className="flex items-start justify-between gap-4"><h3 className="font-display text-2xl">{localized(dish.name,locale)}</h3><span className="text-right"><strong>€ {dish.price.toFixed(2).replace(".",",")}</strong>{!dish.available&&<small className="mt-1 block text-[#a52520]">{copy.unavailable}</small>}</span></div><p className="mt-3 min-h-12 text-sm leading-6 text-[#10261e]/60">{localized(dish.description,locale)}</p><div className="mt-5 flex items-center justify-between"><span className="flex gap-2 text-[#59705f]">{dish.vegetarian?<Leaf size={17}/>:null}{dish.spicy?<Pepper size={17}/>:null}</span><Link href={withLocale(`/menu/${dish.id}`,locale)} className="flex items-center gap-2 text-sm font-semibold text-[#a52520]">{copy.details} <ArrowRight size={16}/></Link></div></div></article>)}</div></section>
    })}</div>
    <section className="bg-[#10261e] px-5 py-16 text-center text-[#f5e8d3]"><h2 className="font-display text-4xl">{copy.cta}</h2><Link href={withLocale("/reservieren",locale)} className="button-primary mt-7">{copy.reserve} <ArrowRight size={17}/></Link></section>
  </main>;
}
export default function MenuPage(){return <MenuContent locale="de"/>}
