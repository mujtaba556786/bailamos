import { env } from "cloudflare:workers";
import { bookingResponse,readBody } from "../../../../../../lib/booking-http.ts";
import { BookingError } from "../../../../../../lib/booking-policy.ts";
import { validateCampaign } from "../../../../../../lib/marketing-campaign.ts";
import { publishYoutubeVideo } from "../../../../../../lib/youtube-publishing.ts";

function authorize(request:Request){if(!env.ADMIN_API_KEY||request.headers.get("x-admin-key")!==env.ADMIN_API_KEY)throw new BookingError(401,"UNAUTHORIZED","Nicht autorisiert.");if(!env.DB)throw new BookingError(503,"STORAGE_UNAVAILABLE","Speicher ist nicht verfügbar.")}
export async function POST(request:Request){return bookingResponse(async()=>{authorize(request);const body=await readBody(request),id=typeof body?.campaignId==="string"?body.campaignId:"";if(!id)throw new BookingError(400,"CAMPAIGN_REQUIRED","Bitte zuerst eine Kampagne speichern.");const row=await env.DB!.prepare("SELECT content_json FROM marketing_campaigns WHERE id=?").bind(id).first<{content_json:string}>();if(!row)throw new BookingError(404,"CAMPAIGN_NOT_FOUND","Gespeicherte Kampagne nicht gefunden.");const campaign=validateCampaign(JSON.parse(row.content_json));if(!campaign.approved)throw new BookingError(409,"CAMPAIGN_NOT_APPROVED","Bitte den Beitrag prüfen, freigeben und speichern.");if(campaign.destinations.youtube!=="now")throw new BookingError(409,"YOUTUBE_NOT_SELECTED","Bitte YouTube als Kanal für jetzt auswählen.");return{ok:true,youtube:await publishYoutubeVideo(env,campaign)}})}
