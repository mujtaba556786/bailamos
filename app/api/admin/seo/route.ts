import { env } from "cloudflare:workers";
import { bookingResponse, readBody } from "../../../../lib/booking-http.ts";
import { BookingError } from "../../../../lib/booking-policy.ts";
import { getSeoContent, saveSeoContent } from "../../../../lib/seo-content.ts";
function db(request:Request){if(!env.ADMIN_API_KEY||request.headers.get("x-admin-key")!==env.ADMIN_API_KEY)throw new BookingError(401,"UNAUTHORIZED","Nicht autorisiert.");if(!env.DB)throw new Error("Missing DB");return env.DB}
export async function GET(request:Request){return bookingResponse(async()=>{const result=await getSeoContent(db(request));return{...result,aiConfigured:Boolean(env.OPENAI_API_KEY)}})}
export async function PUT(request:Request){return bookingResponse(async()=>{const database=db(request),body=await readBody(request);if(!body||!Number.isInteger(body.version)||body.version<0)throw new BookingError(400,"INVALID_VERSION","Ungültige Version.");return saveSeoContent(database,body.content,body.version)})}
