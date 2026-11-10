import { env } from "cloudflare:workers";
// Only the marketing folder is public. Everything else in the bucket stays private.
const PUBLIC_PREFIX = "marketing/";
export async function GET(_:Request,{params}:{params:Promise<{key:string[]}>}){
  if(!env.BUCKET)return new Response("Media unavailable",{status:503});
  const key=(await params).key.join("/");
  if(!key.startsWith(PUBLIC_PREFIX)||key.includes(".."))return new Response("Not found",{status:404});
  const object=await env.BUCKET.get(key);
  if(!object)return new Response("Not found",{status:404});
  const headers=new Headers();object.writeHttpMetadata(headers);headers.set("etag",object.httpEtag);headers.set("x-content-type-options","nosniff");
  return new Response(object.body,{headers});
}
