import { env } from "cloudflare:workers";
import { finishTiktokAuthorization } from "../../../../../lib/tiktok-publishing.ts";

export async function GET(request:Request){
  const url=new URL(request.url),code=url.searchParams.get("code"),state=url.searchParams.get("state"),error=url.searchParams.get("error");
  if(error)return Response.redirect(new URL(`/admin?view=studio&tiktok=${encodeURIComponent(error)}`,url.origin),302);
  if(!code||!state)return Response.redirect(new URL("/admin?view=studio&tiktok=invalid",url.origin),302);
  try{await finishTiktokAuthorization(env,code,state);return Response.redirect(new URL("/admin?view=studio&tiktok=connected",url.origin),302)}
  catch{return Response.redirect(new URL("/admin?view=studio&tiktok=failed",url.origin),302)}
}
