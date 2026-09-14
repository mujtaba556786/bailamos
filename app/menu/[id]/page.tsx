import Image from "next/image";
import Link from "next/link";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { ArrowRight, Flame, Leaf } from "lucide-react";
import { getMenuContent } from "../../../lib/menu-content.ts";
import { SiteHeader } from "../../../components/site-header";
import type { Metadata } from "next";
import { absoluteMediaUrl } from "../../../lib/site-url";

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params,{content}=await getMenuContent(env.DB),dish=content.dishes.find(item=>item.id===id);if(!dish)return{title:"Gericht nicht gefunden",robots:{index:false}};return{title:dish.name.de,description:dish.description.de,alternates:{canonical:`/menu/${dish.id}`},openGraph:{title:`${dish.name.de} | Bailamos`,description:dish.description.de,url:`/menu/${dish.id}`,images:[absoluteMediaUrl(dish.image)]}}}

export default async function DishPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params,{content:menu}=await getMenuContent(env.DB),dish=menu.dishes.find(item=>item.id===id);
  if(!dish)notFound();
  return <main className="min-h-screen bg-[#0b1712] text-[#f5e8d3]"><SiteHeader active="Speisekarte"/><div className="grid min-h-[calc(100vh-6rem)] lg:grid-cols-2"><div className="relative min-h-[48vh]"><Image src={dish.image} alt={dish.name.de} fill className="object-cover" priority/><div className="absolute inset-0 bg-gradient-to-t from-[#0b1712] via-transparent to-black/20"/></div><section className="flex items-center px-7 py-14 sm:px-14 lg:px-20"><div className="max-w-xl"><p className="eyebrow">Bailamos Speisekarte</p><h1 className="font-display mt-4 text-6xl">{dish.name.de}</h1><p className="mt-5 text-2xl text-[#d6a45f]">€ {dish.price.toFixed(2).replace(".",",")}</p>{!dish.available&&<p className="mt-6 inline-flex rounded-full bg-[#a52520] px-4 py-2 text-sm font-semibold">Aktuell nicht verfügbar</p>}<p className="mt-8 text-lg leading-8 text-white/68">{dish.description.de}</p><div className="mt-8 flex flex-wrap gap-3">{dish.vegetarian?<span className="rounded-full border border-[#c68a3b]/35 px-4 py-2 text-sm"><Leaf className="mr-2 inline" size={16}/>Vegetarisch</span>:null}{dish.spicy?<span className="rounded-full border border-[#c68a3b]/35 px-4 py-2 text-sm"><Flame className="mr-2 inline" size={16}/>Schärfe {dish.spicy}/3</span>:null}{dish.allergens.map(allergen=><span key={allergen} className="rounded-full border border-white/15 px-4 py-2 text-sm">Enthält {allergen}</span>)}</div><div className="mt-12 border-t border-[#c68a3b]/30 pt-9"><h2 className="font-display text-3xl">Dieses Gericht probieren?</h2><p className="mt-2 text-white/55">Das Gericht wird nicht vorbestellt. Wir reservieren ausschließlich Ihren Tisch.</p><div className="mt-6 flex gap-4"><Link href="/menu" className="button-secondary">Zur Speisekarte</Link><Link href="/reservieren" className="button-primary">Tisch reservieren <ArrowRight size={17}/></Link></div></div></div></section></div></main>;
}
