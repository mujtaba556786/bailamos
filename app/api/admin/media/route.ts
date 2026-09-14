import { env } from "cloudflare:workers";
import { bookingResponse } from "../../../../lib/booking-http.ts";
import { BookingError } from "../../../../lib/booking-policy.ts";
const allowed=new Set(["image/jpeg","image/png","image/webp","video/mp4","video/webm"]);
export async function POST(request:Request){return bookingResponse(async()=>{
  if(!env.ADMIN_API_KEY||request.headers.get("x-admin-key")!==env.ADMIN_API_KEY)throw new BookingError(401,"UNAUTHORIZED","Nicht autorisiert.");
  if(!env.BUCKET)throw new Error("Missing BUCKET");
  const type=(request.headers.get("content-type")||"").split(";")[0],length=Number(request.headers.get("content-length")||0);
  if(!allowed.has(type))throw new BookingError(415,"INVALID_MEDIA","Bitte JPG, PNG, WebP, MP4 oder WebM verwenden.");
  if(!request.body||!Number.isFinite(length)||length<=0)throw new BookingError(400,"EMPTY_MEDIA","Die Datei ist leer oder ihre Größe ist unbekannt.");
  if(length>50*1024*1024)throw new BookingError(413,"MEDIA_TOO_LARGE","Die Datei darf maximal 50 MB groß sein.");
  const extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","video/webm":"webm"}[type];
  const key=`marketing/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key,request.body,{httpMetadata:{contentType:type,cacheControl:"public, max-age=31536000, immutable"}});
  return {ok:true,url:`/api/media/${encodeURIComponent(key)}`,kind:type.startsWith("video/")?"video":"image"};
})}
