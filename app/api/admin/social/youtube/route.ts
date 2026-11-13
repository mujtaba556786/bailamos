import { requireTab } from '../../../../../lib/admin-auth.ts';
import { env } from "cloudflare:workers";
import { bookingResponse } from "../../../../../lib/booking-http.ts";
import { BookingError } from "../../../../../lib/booking-policy.ts";
import { createYoutubeAuthorization,youtubeConnectionStatus } from "../../../../../lib/youtube-publishing.ts";

async function authorize(request:Request){await requireTab(request, 'studio');}
export async function GET(request:Request){return bookingResponse(async()=>{await authorize(request);return youtubeConnectionStatus(env)})}
export async function POST(request:Request){return bookingResponse(async()=>{await authorize(request);return{authorizationUrl:await createYoutubeAuthorization(env)}})}
