import { requireTab } from '../../../../lib/admin-auth.ts';
import { env } from "cloudflare:workers";
import { bookingResponse } from "../../../../lib/booking-http.ts";
import { BookingError } from "../../../../lib/booking-policy.ts";
import { adminRateLimit } from "../../../../lib/admin-rate-limit.ts";
import { detectMediaType, peekStream, uploadPolicy } from "../../../../lib/media-upload.ts";

// Image and video uploads for Website-Inhalte and Speisekarte.
// Checks: allowed type, file content matches the type, size limit, random file name.
// ?purpose=hero (homepage carousel): images only incl. AVIF, at most 5 MB.
export async function POST(request:Request){return bookingResponse(async()=>{
  await requireTab(request, 'content', 'menu');
  if(!env.BUCKET)throw new Error("Missing BUCKET");
  await adminRateLimit(env.DB, request, 'upload');
  const policy=uploadPolicy(new URL(request.url).searchParams.get("purpose"));
  const type=(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase(),length=Number(request.headers.get("content-length")||0);
  if(!(type in policy.types))throw new BookingError(415,"INVALID_MEDIA",`Bitte ${policy.typeText} verwenden.`);
  if(!request.body||!Number.isFinite(length)||length<=0)throw new BookingError(400,"EMPTY_MEDIA","Die Datei ist leer oder ihre Größe ist unbekannt.");
  if(length>policy.maxBytes)throw new BookingError(413,"MEDIA_TOO_LARGE",`Die Datei darf maximal ${policy.sizeText} groß sein.`);
  const {head,stream}=await peekStream(request.body);
  if(detectMediaType(head)!==type){await stream.cancel().catch(()=>{});throw new BookingError(415,"MEDIA_MISMATCH",`Der Dateiinhalt passt nicht zum Dateityp. Bitte ein echtes ${policy.typeText} hochladen.`);}
  // FixedLengthStream enforces the declared size: a body longer or shorter than content-length fails the upload.
  const sized=new FixedLengthStream(length);
  const piping=stream.pipeTo(sized.writable);
  const key=`${policy.folder}/${crypto.randomUUID()}.${policy.types[type]}`;
  try{await Promise.all([env.BUCKET.put(key,sized.readable,{httpMetadata:{contentType:type,cacheControl:"public, max-age=31536000, immutable"}}),piping])}
  catch{throw new BookingError(400,"UPLOAD_INCOMPLETE","Die Datei kam nicht vollständig an. Bitte erneut versuchen.")}
  return {ok:true,url:`/api/media/${encodeURIComponent(key)}`,kind:type.startsWith("video/")?"video":"image"};
})}
