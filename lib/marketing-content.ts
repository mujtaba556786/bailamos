import defaults from "../data/marketing.json" with { type: "json" };
import { BookingError } from "./booking-policy.ts";

export type MarketingContent = typeof defaults;
const text = (value: unknown, label: string, max: number) => {
  if (typeof value !== "string") throw new BookingError(400,"INVALID_CONTENT",`${label} fehlt.`);
  const clean = value.trim().normalize("NFC");
  if (!clean || clean.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(clean)) throw new BookingError(400,"INVALID_CONTENT",`${label} ist ungültig.`);
  return clean;
};
const url = (value: unknown, label: string, allowHash = false) => {
  const clean = text(value,label,1000);
  if (allowHash && clean === "#") return clean;
  if (clean.startsWith("/") && !clean.startsWith("//")) return clean;
  try { const parsed = new URL(clean); if (["https:","http:"].includes(parsed.protocol)) return clean; } catch {}
  throw new BookingError(400,"INVALID_URL",`${label} muss eine sichere Webadresse sein.`);
};
const slug = (value: unknown) => {
  const clean=text(value,"Event-ID",80);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean))throw new BookingError(400,"INVALID_CONTENT","Die Event-ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.");
  return clean;
};
export function validateMarketingContent(value: unknown): MarketingContent {
  if(!value||typeof value!=="object"||Array.isArray(value))throw new BookingError(400,"INVALID_CONTENT","Ungültige Inhalte.");
  const v=value as Record<string,any>, social=v.social||{}, media=v.demoMedia||{};
  if(!Array.isArray(v.events)||v.events.length>50||!Array.isArray(media.gallery)||media.gallery.length>60||!Array.isArray(media.videos)||media.videos.length>30)throw new BookingError(400,"INVALID_CONTENT","Zu viele oder ungültige Inhalte.");
  const ids=new Set<string>();
  const events=v.events.map((event:Record<string,any>)=>{
    const id=slug(event.id);if(ids.has(id))throw new BookingError(400,"DUPLICATE_EVENT","Event-IDs müssen eindeutig sein.");ids.add(id);
    const date=text(event.date,"Event-Datum",10),time=text(event.time,"Event-Uhrzeit",5);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new BookingError(400,"INVALID_CONTENT","Bitte Datum und Uhrzeit des Events prüfen.");
    return {id,title:{de:text(event.title?.de,"Event-Titel",120),en:text(event.title?.en||event.title?.de,"Englischer Event-Titel",120)},summary:{de:text(event.summary?.de,"Event-Beschreibung",1200),en:text(event.summary?.en||event.summary?.de,"Englische Event-Beschreibung",1200)},date,time,image:url(event.image,"Event-Bild"),featured:event.featured===true,published:event.published===true};
  });
  return {
    announcement:{enabled:v.announcement?.enabled===true,de:text(v.announcement?.de||"Keine Ankündigung","Ankündigung",180),en:text(v.announcement?.en||v.announcement?.de||"No announcement","Englische Ankündigung",180),link:text(v.announcement?.link||"/events","Ankündigungslink",300)},
    hero:{type:"image",image:text(v.hero?.image||"/table-terrace.webp","Hero-Bild",1000),video:null,poster:text(v.hero?.poster||v.hero?.image||"/table-terrace.webp","Hero-Poster",1000)},
    demoMedia:{notice:text(media.notice||"Eigene Medien von Bailamos.","Medienhinweis",300),videos:media.videos.map((item:Record<string,any>)=>({title:text(item.title,"Videotitel",120),source:text(item.source||"Bailamos","Videoquelle",80),url:url(item.url,"Video-Link"),poster:url(item.poster,"Video-Poster")})),gallery:media.gallery.map((item:Record<string,any>)=>({label:text(item.label,"Bildtitel",100),source:text(item.source||"Bailamos","Bildquelle",80),url:url(item.url||item.image,"Bild-Link"),image:url(item.image,"Bildadresse")}))},
    social:{instagram:{url:url(social.instagram?.url||"#","Instagram-Link",true),handle:text(social.instagram?.handle||"@bailamos.berlin","Instagram-Name",80)},facebook:{url:url(social.facebook?.url||"#","Facebook-Link",true),handle:text(social.facebook?.handle||"Bailamos Berlin","Facebook-Name",80)},tiktok:{url:url(social.tiktok?.url||"#","TikTok-Link",true),handle:text(social.tiktok?.handle||"@bailamos.berlin","TikTok-Name",80)}},events,
  } as MarketingContent;
}
export async function getMarketingContent(db?:D1Database):Promise<{content:MarketingContent;version:number;source:"saved"|"default"}> {
  if(!db)return {content:defaults,version:0,source:"default"};
  try{const row=await db.prepare("SELECT content_json,version FROM marketing_content WHERE id = 'primary'").first<{content_json:string;version:number}>();if(!row)return {content:defaults,version:0,source:"default"};return {content:validateMarketingContent(JSON.parse(row.content_json)),version:row.version,source:"saved"};}
  catch(error){console.error("Marketing content unavailable",error);return {content:defaults,version:0,source:"default"};}
}
export async function saveMarketingContent(db:D1Database,value:unknown,expectedVersion:number){
  const content=validateMarketingContent(value),stamp=new Date().toISOString();
  if(expectedVersion===0){try{await db.prepare("INSERT INTO marketing_content (id,content_json,version,updated_at) VALUES ('primary',?,1,?)").bind(JSON.stringify(content),stamp).run();return {content,version:1}}catch(error){if(!String(error).includes("UNIQUE"))throw error;}}
  const result=await db.prepare("UPDATE marketing_content SET content_json = ?,version = version + 1,updated_at = ? WHERE id = 'primary' AND version = ?").bind(JSON.stringify(content),stamp,expectedVersion).run();
  if(!result.meta.changes)throw new BookingError(409,"STALE_CONTENT","Die Inhalte wurden inzwischen geändert. Bitte laden Sie sie neu.");
  return {content,version:expectedVersion+1};
}
