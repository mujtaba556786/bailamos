import { requireTab } from '../../../../lib/admin-auth.ts';
import { env } from "cloudflare:workers";
import { bookingResponse, readBody } from "../../../../lib/booking-http.ts";
import { BookingError } from "../../../../lib/booking-policy.ts";
import { getSeoContent, saveSeoContent } from "../../../../lib/seo-content.ts";
import { adminRateLimit } from "../../../../lib/admin-rate-limit.ts";
async function db(request:Request){await requireTab(request, 'seo');if(!env.DB)throw new Error("Missing DB");return env.DB}
export async function GET(request:Request){return bookingResponse(async()=>{const result=await getSeoContent(await db(request));return{...result,aiConfigured:Boolean(env.OPENAI_API_KEY)}})}
export async function PUT(request:Request){return bookingResponse(async()=>{const database=await db(request);await adminRateLimit(database,request,"publish");const body=await readBody(request, 200000);if(!body||!Number.isInteger(body.version)||body.version<0)throw new BookingError(400,"INVALID_VERSION","Ungültige Version.");return saveSeoContent(database,body.content,body.version)})}
