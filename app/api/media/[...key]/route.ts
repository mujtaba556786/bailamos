import { env } from "cloudflare:workers";
// Only the marketing folder is public. Everything else in the bucket stays private.
const PUBLIC_PREFIX = "marketing/";
// Safari (iPhone) asks for byte ranges to play video, so this route answers Range requests with 206 Partial Content.
export async function GET(request:Request,{params}:{params:Promise<{key:string[]}>}){
  if(!env.BUCKET)return new Response("Media unavailable",{status:503});
  const key=(await params).key.join("/");
  if(!key.startsWith(PUBLIC_PREFIX)||key.includes(".."))return new Response("Not found",{status:404});
  const wantsRange=request.headers.has("range");
  let object;
  try{object=await env.BUCKET.get(key,wantsRange?{range:request.headers}:undefined)}catch{return new Response("Range not satisfiable",{status:416,headers:{"content-range":"bytes */0"}})}
  if(!object)return new Response("Not found",{status:404});
  const headers=new Headers();object.writeHttpMetadata(headers);
  headers.set("etag",object.httpEtag);headers.set("x-content-type-options","nosniff");
  headers.set("accept-ranges","bytes");headers.set("cache-control","public, max-age=86400");
  // R2 reports the byte range it sent when a Range header was given; otherwise the whole object.
  const range=(object as {range?:{offset?:number;length?:number;suffix?:number}}).range;
  if(range&&object.size){
    const start=range.suffix!==undefined?object.size-range.suffix:(range.offset??0);
    const length=range.suffix!==undefined?range.suffix:(range.length??object.size-start);
    const end=start+length-1;
    headers.set("content-range",`bytes ${start}-${end}/${object.size}`);
    headers.set("content-length",String(length));
    return new Response(object.body,{status:206,headers});
  }
  headers.set("content-length",String(object.size));
  return new Response(object.body,{headers});
}
