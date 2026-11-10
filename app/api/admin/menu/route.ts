import { requireAdmin } from '../../../../lib/admin-auth.ts';
import { env } from "cloudflare:workers";
import { bookingResponse,readBody } from "../../../../lib/booking-http.ts";
import { BookingError } from "../../../../lib/booking-policy.ts";
import { getMenuContent,saveMenuContent } from "../../../../lib/menu-content.ts";
async function db(request:Request){await requireAdmin(request);if(!env.DB)throw new Error("Missing DB");return env.DB}
export async function GET(request:Request){return bookingResponse(async()=>({...await getMenuContent(await db(request)),aiConfigured:Boolean(env.OPENAI_API_KEY)}))}
export async function PUT(request:Request){return bookingResponse(async()=>{const database=await db(request),body=await readBody(request, 200000);if(!body||!Number.isInteger(body.version)||body.version<0)throw new BookingError(400,"INVALID_VERSION","Ungültige Menüversion.");return saveMenuContent(database,body.content,body.version)})}
