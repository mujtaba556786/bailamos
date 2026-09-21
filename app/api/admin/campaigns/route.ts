import { env } from 'cloudflare:workers';
import { bookingResponse,readBody } from '../../../../lib/booking-http.ts';
import { BookingError } from '../../../../lib/booking-policy.ts';
import { listCampaigns,saveCampaign } from '../../../../lib/marketing-campaign.ts';
function db(request:Request){
 if(!env.ADMIN_API_KEY||request.headers.get('x-admin-key')!==env.ADMIN_API_KEY)throw new BookingError(401,'UNAUTHORIZED','Nicht autorisiert.');
 if(!env.DB)throw new BookingError(503,'STORAGE_UNAVAILABLE','Kampagnen können gerade nicht gespeichert werden.');
 return env.DB;
}
export async function GET(request:Request){return bookingResponse(async()=>{
 return {campaigns:await listCampaigns(db(request)),publishing:{configured:false,reason:'Zuerst Veröffentlichungsdienst auswählen und Social-Media-Konten verbinden.'}};
})}
export async function PUT(request:Request){return bookingResponse(async()=>{
 const database=db(request),body=await readBody(request);
 return saveCampaign(database,body?.content,body?.version);
})}
export async function POST(request:Request){return bookingResponse(async()=>{
 db(request);
 throw new BookingError(503,'PUBLISHING_NOT_CONFIGURED','Direktes Veröffentlichen ist noch nicht eingerichtet. Entwurf speichern oder Medien herunterladen und manuell posten.');
})}
