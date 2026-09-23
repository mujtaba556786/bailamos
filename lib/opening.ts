import { BookingError } from './booking-policy.ts';

export type Opening = {enabled:boolean;autoReveal:boolean;openingDate:string;image:string;video:string;headline:{de:string;en:string};message:{de:string;en:string}};
export const defaultOpening:Opening={enabled:true,autoReveal:false,openingDate:'',image:'/bailamos-logo.jpg',video:'',headline:{de:'Ein neues Kapitel im Wald Café',en:'A new chapter at Wald Café'},message:{de:'Bailamos · Mexikanisches Restaurant & Cocktail Bar. Demnächst in Brandenburg an der Havel. Den genauen Eröffnungstermin geben wir hier bekannt.',en:'Bailamos · Mexican Restaurant & Cocktail Bar. Opening soon in Brandenburg an der Havel. Our confirmed opening date will be announced here.'}};
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value}
export function revealDate(date:string){if(!validDate(date))return '';const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-2);return d.toISOString().slice(0,10)}
export function openingActive(config:Opening,now=new Date()){
  if(!config.enabled)return false;
  if(!config.autoReveal||!validDate(config.openingDate))return true;
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=(name:string)=>parts.find(x=>x.type===name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`<revealDate(config.openingDate);
}
export function validateOpening(value:unknown):Opening{
  if(value===undefined)return structuredClone(defaultOpening);
  const v=value as Opening;
  if(!v||typeof v!=='object')throw new BookingError(400,'INVALID_OPENING','Ungültiger Eröffnungsbildschirm.');
  for(const key of ['headline','message'] as const)for(const lang of ['de','en'] as const){if(typeof v[key]?.[lang]!=='string'||!v[key][lang].trim()||v[key][lang].length>(key==='headline'?120:700))throw new BookingError(400,'INVALID_OPENING','Bitte deutsche und englische Bannertexte prüfen.');}
  if(typeof v.openingDate!=='string'||(v.openingDate&&!validDate(v.openingDate))||(v.autoReveal&&!v.openingDate))throw new BookingError(400,'INVALID_OPENING','Für die automatische Freigabe ist ein bestätigtes Eröffnungsdatum erforderlich.');
  for(const key of ['image','video'] as const){const path=v[key];if(typeof path!=='string'||path.length>1000||(path&&(!path.startsWith('/')||path.startsWith('//')||path.includes('\\')||path.includes('..')||/[\u0000-\u0020]/.test(path))))throw new BookingError(400,'INVALID_OPENING','Bitte ein eigenes hochgeladenes Bild oder Video auswählen.');}
  return {enabled:v.enabled===true,autoReveal:v.autoReveal===true,openingDate:v.openingDate,image:v.image,video:v.video,headline:{de:v.headline.de.trim(),en:v.headline.en.trim()},message:{de:v.message.de.trim(),en:v.message.en.trim()}};
}
export function openingDraft(){return {id:'bailamos-opening',title:{de:'Bailamos · Eröffnung im Wald Café',en:'Bailamos · Opening at Wald Café'},summary:{de:'Ein neues Kapitel in Brandenburg an der Havel: Bailamos eröffnet im Wald Café. Termin, Uhrzeit und Programm werden nach Bestätigung ergänzt.',en:'A new chapter in Brandenburg an der Havel: Bailamos is opening at Wald Café. The date, time and programme will be added once confirmed.'},date:'',time:'',image:'/bailamos-logo.jpg',featured:true,published:false}}
