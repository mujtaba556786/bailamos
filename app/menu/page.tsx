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

export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB),page=content.pages.menu;return{title:page.title,description:page.description,alternates:{canonical:"/menu"},openGraph:{title:page.title,description:page.description,url:"/menu"}}}

export default async function MenuPage(){
  const {content:menu}=await getMenuContent(env.DB);
  return <main className="min-h-screen bg-[#fff8ec] text-[#10261e]">
    <StructuredData data={{"@context":"https://schema.org","@type":"Menu","@id":`${getSiteUrl("/menu")}#menu`,name:"Bailamos Speisekarte",url:getSiteUrl("/menu").toString(),hasMenuSection:menu.categories.map(category=>({"@type":"MenuSection",name:category.name.de,hasMenuItem:menu.dishes.filter(dish=>dish.categoryId===category.id).map(dish=>({"@type":"MenuItem",name:dish.name.de,description:dish.description.de,image:absoluteMediaUrl(dish.image),offers:{"@type":"Offer",price:dish.price.toFixed(2),priceCurrency:"EUR",availability:`https://schema.org/${dish.available?"InStock":"OutOfStock"}`}}))}))}}/>
    <SiteHeader active="Speisekarte"/>
    <section className="border-b border-[#c68a3b]/25 px-5 py-16 text-center sm:px-10"><p className="eyebrow">Tradition. Raffinesse. Mexiko im Herzen.</p><h1 className="font-display mt-3 text-6xl sm:text-7xl">Speisekarte</h1><p className="mx-auto mt-5 max-w-2xl text-[#10261e]/60">Klassische Aromen, moderne Handschrift und Zutaten, die wir mit Respekt behandeln.</p></section>
    <div className="sticky top-0 z-10 overflow-x-auto border-b border-[#c68a3b]/20 bg-[#fff8ec]/95 px-5 py-4 backdrop-blur"><div className="mx-auto flex w-max max-w-7xl gap-3">{menu.categories.map(category=><a key={category.id} href={`#${category.id}`} className="rounded-full border border-[#10261e]/15 px-5 py-2 text-sm hover:bg-[#10261e] hover:text-white">{category.name.de}</a>)}</div></div>
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-10">{menu.categories.map(category=>{
      const dishes=menu.dishes.filter(dish=>dish.categoryId===category.id);
      return <section id={category.id} key={category.id} className="mb-20 scroll-mt-24"><div className="mb-7 flex items-end justify-between border-b border-[#c68a3b]/35 pb-4"><h2 className="font-display text-4xl">{category.name.de}</h2><span className="text-sm text-[#10261e]/45">{dishes.length} Gerichte</span></div><div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">{dishes.map(dish=><article key={dish.id} className={`group overflow-hidden rounded-2xl bg-white shadow-[0_15px_50px_rgba(16,38,30,.09)] ${dish.available?"":"opacity-60"}`}><div className="relative aspect-[4/3] overflow-hidden"><Image src={dish.image} alt={dish.name.de} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="33vw"/></div><div className="p-6"><div className="flex items-start justify-between gap-4"><h3 className="font-display text-2xl">{dish.name.de}</h3><span className="text-right"><strong>€ {dish.price.toFixed(2).replace(".",",")}</strong>{!dish.available&&<small className="mt-1 block text-[#a52520]">Heute nicht verfügbar</small>}</span></div><p className="mt-3 min-h-12 text-sm leading-6 text-[#10261e]/60">{dish.description.de}</p><div className="mt-5 flex items-center justify-between"><span className="flex gap-2 text-[#59705f]">{dish.vegetarian?<Leaf size={17}/>:null}{dish.spicy?<Pepper size={17}/>:null}</span><Link href={`/menu/${dish.id}`} className="flex items-center gap-2 text-sm font-semibold text-[#a52520]">Details <ArrowRight size={16}/></Link></div></div></article>)}</div></section>
    })}</div>
    <section className="bg-[#10261e] px-5 py-16 text-center text-[#f5e8d3]"><h2 className="font-display text-4xl">Ihr Liebling schon gefunden?</h2><Link href="/reservieren" className="button-primary mt-7">Tisch reservieren <ArrowRight size={17}/></Link></section>
  </main>;
}
