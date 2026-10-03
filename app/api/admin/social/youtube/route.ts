import { env } from "cloudflare:workers";
import { bookingResponse } from "../../../../../lib/booking-http.ts";
import { BookingError } from "../../../../../lib/booking-policy.ts";
import { createYoutubeAuthorization,youtubeConnectionStatus } from "../../../../../lib/youtube-publishing.ts";

function authorize(request:Request){if(!env.ADMIN_API_KEY||request.headers.get("x-admin-key")!==env.ADMIN_API_KEY)throw new BookingError(401,"UNAUTHORIZED","Nicht autorisiert.")}
export async function GET(request:Request){return bookingResponse(async()=>{authorize(request);return youtubeConnectionStatus(env)})}
export async function POST(request:Request){return bookingResponse(async()=>{authorize(request);return{authorizationUrl:await createYoutubeAuthorization(env)}})}
