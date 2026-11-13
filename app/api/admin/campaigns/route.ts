import { requireTab } from '../../../../lib/admin-auth.ts';
import { env } from 'cloudflare:workers';
import { bookingResponse,readBody } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';
import { listCampaigns,saveCampaign } from '../../../../lib/marketing-campaign.ts';
async function db(request:Request){
 await requireTab(request, 'studio');
 if(!env.DB)throw new BookingError(503,'STORAGE_UNAVAILABLE','Kampagnen können gerade nicht gespeichert werden.');
 return env.DB;
}
export async function GET(request:Request){return bookingResponse(async()=>{
 return {campaigns:await listCampaigns(await db(request)),publishing:{configured:false,reason:'Zuerst Veröffentlichungsdienst auswählen und Social-Media-Konten verbinden.'}};
})}
export async function PUT(request:Request){return bookingResponse(async()=>{
 const database=await db(request),body=await readBody(request, 200000);
 return saveCampaign(database,body?.content,body?.version);
})}
export async function POST(request:Request){return bookingResponse(async()=>{
 await db(request);
 throw new BookingError(503,'PUBLISHING_NOT_CONFIGURED','Direktes Veröffentlichen ist noch nicht eingerichtet. Entwurf speichern oder Medien herunterladen und manuell posten.');
})}
