import { env } from "cloudflare:workers";
export async function GET(_:Request,{params}:{params:Promise<{key:string[]}>}){
  if(!env.BUCKET)return new Response("Media unavailable",{status:503});
  const {key}=await params,object=await env.BUCKET.get(key.join("/"));
  if(!object)return new Response("Not found",{status:404});
  const headers=new Headers();object.writeHttpMetadata(headers);headers.set("etag",object.httpEtag);headers.set("x-content-type-options","nosniff");
  return new Response(object.body,{headers});
}
