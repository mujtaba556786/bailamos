import { env } from "cloudflare:workers";
import { finishYoutubeAuthorization } from "../../../../../lib/youtube-publishing.ts";

export async function GET(request:Request){
  const url=new URL(request.url),code=url.searchParams.get("code"),state=url.searchParams.get("state"),error=url.searchParams.get("error");
  if(error)return Response.redirect(new URL(`/admin?view=studio&youtube=${encodeURIComponent(error)}`,url.origin),302);
  if(!code||!state)return Response.redirect(new URL("/admin?view=studio&youtube=invalid",url.origin),302);
  try{await finishYoutubeAuthorization(env,code,state);return Response.redirect(new URL("/admin?view=studio&youtube=connected",url.origin),302)}
  catch{return Response.redirect(new URL("/admin?view=studio&youtube=failed",url.origin),302)}
}
