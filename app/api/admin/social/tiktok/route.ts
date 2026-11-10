import { requireAdmin } from '../../../../../lib/admin-auth.ts';
import { env } from "cloudflare:workers";
import { bookingResponse } from "../../../../../lib/booking-http.ts";
import { BookingError } from "../../../../../lib/booking-policy.ts";
import { checkTiktokCredentials,createTiktokAuthorization,tiktokConnectionStatus } from "../../../../../lib/tiktok-publishing.ts";

async function authorize(request:Request){await requireAdmin(request);}
export async function GET(request:Request){return bookingResponse(async()=>{await authorize(request);if(new URL(request.url).searchParams.get("check")==="credentials")return checkTiktokCredentials(env);return tiktokConnectionStatus(env)})}
export async function POST(request:Request){return bookingResponse(async()=>{await authorize(request);return{authorizationUrl:await createTiktokAuthorization(env)}})}
