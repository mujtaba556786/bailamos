import { BookingError } from './booking-policy.ts';

export const channels = ['instagram', 'tiktok', 'facebook'] as const;
export type Channel = typeof channels[number];
export type Campaign = {
  id: string; title: string; headline: string; detail: string; cta: string;
  captionDe: string; captionEn: string; language: 'de'|'en';
  mediaUrl: string; mediaKind: 'image'|'video'; format: 'portrait'|'square'|'story';
  destinations: Record<Channel,'now'|'later'|'skip'>; approved: boolean;
};
export type SavedCampaign = {content: Campaign; version: number; updatedAt: string};
export async function listCampaigns(db:D1Database):Promise<SavedCampaign[]>{
 const rows=await db.prepare('SELECT content_json,version,updated_at FROM marketing_campaigns ORDER BY updated_at DESC LIMIT 100').all<{content_json:string;version:number;updated_at:string}>();
 return rows.results.map(row=>({content:JSON.parse(row.content_json),version:row.version,updatedAt:row.updated_at}));
}
export async function saveCampaign(db:D1Database,input:unknown,version:number):Promise<SavedCampaign>{
 const content=validateCampaign(input),stamp=new Date().toISOString();
 if(!Number.isInteger(version)||version<0)throw new BookingError(400,'INVALID_VERSION','Ungültige Version.');
 const result=version===0
  ?await db.prepare('INSERT OR IGNORE INTO marketing_campaigns (id,content_json,version,updated_at) VALUES (?,?,1,?)').bind(content.id,JSON.stringify(content),stamp).run()
  :await db.prepare('UPDATE marketing_campaigns SET content_json=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(content),stamp,content.id,version).run();
 if(!result.meta.changes)throw new BookingError(409,'STALE_CAMPAIGN','Diese Kampagne wurde bereits geändert. Entwurf kopieren oder die gespeicherte Version neu laden.');
 return {content,version:version+1,updatedAt:stamp};
}
export function validateCampaign(input: unknown): Campaign {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new BookingError(400,'INVALID_CAMPAIGN','Ungültige Kampagne.');
  const v=input as Record<string,any>;
  function str(key:string,max:number,required=false){
    if(typeof v[key]!=='string'||v[key].length>max)throw new BookingError(400,'INVALID_CAMPAIGN',`${key}: Bitte Länge und Inhalt prüfen.`);
    const value=v[key].trim();
    if(required&&!value)throw new BookingError(400,'INVALID_CAMPAIGN',`${key} fehlt.`);
    return value;
  }
  const id=str('id',80,true);
  if(!/^[a-z0-9-]+$/.test(id))throw new BookingError(400,'INVALID_CAMPAIGN','Ungültige Kampagnen-ID.');
  const mediaUrl=str('mediaUrl',1000);
  // Only assets served by this site: no private URLs, arbitrary remote fetching or executable URLs.
  if(mediaUrl&&(mediaUrl.startsWith('//')||mediaUrl.includes('..')||!/^\/(?:api\/media\/[a-zA-Z0-9_./%-]+|[a-zA-Z0-9_./%-]+\.(?:jpg|jpeg|png|webp|mp4|webm))$/i.test(mediaUrl)))throw new BookingError(400,'INVALID_MEDIA','Bitte ein Medium hochladen oder ein vorhandenes Website-Medium verwenden.');
  if(!['image','video'].includes(v.mediaKind)||!['portrait','square','story'].includes(v.format)||!['de','en'].includes(v.language))throw new BookingError(400,'INVALID_CAMPAIGN','Bitte Medienformat und Sprache prüfen.');
  const destinations={} as Campaign['destinations'];
  for(const channel of channels){if(!['now','later','skip'].includes(v.destinations?.[channel]))throw new BookingError(400,'INVALID_CHANNEL','Bitte Kanäle auswählen.');destinations[channel]=v.destinations[channel];}
  const result:Campaign={id,title:str('title',100,true),headline:str('headline',90),detail:str('detail',160),cta:str('cta',50),captionDe:str('captionDe',2200),captionEn:str('captionEn',2200),language:v.language,mediaUrl,mediaKind:v.mediaKind,format:v.format,destinations,approved:v.approved===true};
  if(result.approved&&(!mediaUrl||!(result.language==='de'?result.captionDe:result.captionEn)||!channels.some(c=>destinations[c]!=='skip')))throw new BookingError(400,'NOT_READY','Zur Freigabe werden ein Medium, ein Beitragstext und mindestens ein Kanal benötigt.');
  return result;
}
