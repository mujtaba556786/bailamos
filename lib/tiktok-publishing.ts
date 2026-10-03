import { BookingError } from "./booking-policy.ts";
import { decrypt,digest,encrypt } from "./social-crypto.ts";

// TikTok Content Posting API, "upload to inbox" flow: the video lands in the
// restaurant's TikTok inbox as a draft and is finished (sound, caption) in the app.
const provider = "tiktok";
const scope = "user.info.basic,video.upload";
const callbackUrl = "https://bailamos-waldcafe.de/api/social/tiktok/callback";
const api = "https://open.tiktokapis.com/v2";

type TiktokEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  TIKTOK_CLIENT_KEY?: string;
  TIKTOK_CLIENT_SECRET?: string;
  SOCIAL_TOKEN_ENCRYPTION_KEY?: string;
};
type TokenResponse = {access_token?:string;expires_in?:number;refresh_token?:string;refresh_expires_in?:number;open_id?:string;scope?:string;error?:string;error_description?:string};

function requireConfig(env:TiktokEnv){
  if(!env.DB||!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET||!env.SOCIAL_TOKEN_ENCRYPTION_KEY)throw new BookingError(503,"TIKTOK_NOT_CONFIGURED","TikTok ist noch nicht vollständig eingerichtet.");
  // Values pasted into `wrangler secret put` can carry stray whitespace; TikTok rejects them untrimmed.
  return {db:env.DB,clientKey:env.TIKTOK_CLIENT_KEY.trim(),clientSecret:env.TIKTOK_CLIENT_SECRET.trim(),encryptionKey:env.SOCIAL_TOKEN_ENCRYPTION_KEY};
}

async function requestToken(params:Record<string,string>){
  const response=await fetch(`${api}/oauth/token/`,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","cache-control":"no-cache"},body:new URLSearchParams(params)});
  const tokens=await response.json() as TokenResponse;
  if(!response.ok||!tokens.access_token)throw new BookingError(502,"TIKTOK_AUTH_FAILED",tokens.error_description||tokens.error||"TikTok konnte nicht verbunden werden.");
  return tokens as Required<Pick<TokenResponse,"access_token"|"expires_in">>&TokenResponse;
}

export async function createTiktokAuthorization(env:TiktokEnv){
  const {db,clientKey}=requireConfig(env),state=crypto.randomUUID()+crypto.randomUUID(),now=Date.now();
  await db.prepare("DELETE FROM social_oauth_states WHERE expires_at < ?").bind(now).run();
  await db.prepare("INSERT INTO social_oauth_states (state_hash,provider,expires_at,created_at) VALUES (?,?,?,?)").bind(await digest(state),provider,now+10*60*1000,new Date(now).toISOString()).run();
  const url=new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key",clientKey);url.searchParams.set("scope",scope);url.searchParams.set("response_type","code");url.searchParams.set("redirect_uri",callbackUrl);url.searchParams.set("state",state);
  return url.toString();
}

export async function finishTiktokAuthorization(env:TiktokEnv,code:string,state:string){
  const {db,clientKey,clientSecret,encryptionKey:key}=requireConfig(env),stateHash=await digest(state),now=Date.now();
  const saved=await db.prepare("SELECT expires_at FROM social_oauth_states WHERE state_hash=? AND provider=?").bind(stateHash,provider).first<{expires_at:number}>();
  await db.prepare("DELETE FROM social_oauth_states WHERE state_hash=?").bind(stateHash).run();
  if(!saved||saved.expires_at<now)throw new BookingError(400,"INVALID_OAUTH_STATE","Die TikTok-Verbindung ist abgelaufen. Bitte erneut im Dashboard starten.");
  const tokens=await requestToken({client_key:clientKey,client_secret:clientSecret,code,grant_type:"authorization_code",redirect_uri:callbackUrl});
  const stamp=new Date(now).toISOString(),access=await encrypt(tokens.access_token,key),refresh=tokens.refresh_token?await encrypt(tokens.refresh_token,key):null;
  await db.prepare("INSERT INTO social_connections (provider,access_token_encrypted,refresh_token_encrypted,expires_at,scope,account_label,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(provider) DO UPDATE SET access_token_encrypted=excluded.access_token_encrypted,refresh_token_encrypted=excluded.refresh_token_encrypted,expires_at=excluded.expires_at,scope=excluded.scope,account_label=excluded.account_label,updated_at=excluded.updated_at").bind(provider,access,refresh,now+tokens.expires_in*1000,tokens.scope||scope,"@bailamos.waldcafe",stamp,stamp).run();
}

export async function tiktokConnectionStatus(env:TiktokEnv){
  if(!env.DB||!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET||!env.SOCIAL_TOKEN_ENCRYPTION_KEY)return{configured:false,connected:false};
  const row=await env.DB.prepare("SELECT account_label,updated_at FROM social_connections WHERE provider=?").bind(provider).first<{account_label:string;updated_at:string}>();
  return{configured:true,connected:Boolean(row),accountLabel:row?.account_label||"",updatedAt:row?.updated_at||null};
}

// Admin diagnostic: TikTok's client_credentials grant succeeds only for a valid key/secret pair.
export async function checkTiktokCredentials(env:TiktokEnv){
  const {clientKey,clientSecret}=requireConfig(env);
  const response=await fetch(`${api}/oauth/token/`,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","cache-control":"no-cache"},body:new URLSearchParams({client_key:clientKey,client_secret:clientSecret,grant_type:"client_credentials"})});
  const result=await response.json() as TokenResponse;
  return{valid:response.ok&&Boolean(result.access_token),keyLength:clientKey.length,secretLength:clientSecret.length,error:result.error_description||result.error||null};
}

async function accessToken(env:TiktokEnv){
  const {db,clientKey,clientSecret,encryptionKey:key}=requireConfig(env);
  const row=await db.prepare("SELECT access_token_encrypted,refresh_token_encrypted,expires_at FROM social_connections WHERE provider=?").bind(provider).first<{access_token_encrypted:string;refresh_token_encrypted:string|null;expires_at:number}>();
  if(!row)throw new BookingError(409,"TIKTOK_NOT_CONNECTED","Bitte zuerst das TikTok-Konto verbinden.");
  if(row.expires_at>Date.now()+60000)return decrypt(row.access_token_encrypted,key);
  if(!row.refresh_token_encrypted)throw new BookingError(409,"TIKTOK_RECONNECT","Die TikTok-Verbindung muss erneuert werden.");
  const tokens=await requestToken({client_key:clientKey,client_secret:clientSecret,grant_type:"refresh_token",refresh_token:await decrypt(row.refresh_token_encrypted,key)});
  await db.prepare("UPDATE social_connections SET access_token_encrypted=?,refresh_token_encrypted=COALESCE(?,refresh_token_encrypted),expires_at=?,updated_at=? WHERE provider=?").bind(await encrypt(tokens.access_token,key),tokens.refresh_token?await encrypt(tokens.refresh_token,key):null,Date.now()+tokens.expires_in*1000,new Date().toISOString(),provider).run();
  return tokens.access_token;
}

export async function sendTiktokDraft(env:TiktokEnv,campaign:{mediaUrl:string;mediaKind:string}){
  if(!env.BUCKET)throw new BookingError(503,"MEDIA_UNAVAILABLE","Medienspeicher ist nicht verfügbar.");
  if(campaign.mediaKind!=="video")throw new BookingError(400,"TIKTOK_VIDEO_REQUIRED","TikTok benötigt ein Video. Bitte MP4 oder WebM hochladen.");
  const prefix="/api/media/";if(!campaign.mediaUrl.startsWith(prefix))throw new BookingError(400,"INVALID_MEDIA","Bitte ein hochgeladenes Video verwenden.");
  const object=await env.BUCKET.get(decodeURIComponent(campaign.mediaUrl.slice(prefix.length)));
  if(!object)throw new BookingError(404,"MEDIA_NOT_FOUND","Das Kampagnenvideo wurde nicht gefunden.");
  const contentType=object.httpMetadata?.contentType||"application/octet-stream";
  if(!["video/mp4","video/webm"].includes(contentType))throw new BookingError(400,"TIKTOK_VIDEO_REQUIRED","TikTok benötigt ein MP4- oder WebM-Video.");
  // Admin uploads are capped at 50 MB, below TikTok's 64 MB single-chunk limit, so one chunk always fits.
  const token=await accessToken(env),size=object.size;
  const init=await fetch(`${api}/post/publish/inbox/video/init/`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json; charset=UTF-8"},body:JSON.stringify({source_info:{source:"FILE_UPLOAD",video_size:size,chunk_size:size,total_chunk_count:1}})});
  const started=await init.json() as {data?:{publish_id?:string;upload_url?:string};error?:{code?:string;message?:string}};
  if(!init.ok||!started.data?.upload_url||!started.data.publish_id)throw new BookingError(502,"TIKTOK_UPLOAD_FAILED",`TikTok hat den Upload abgelehnt: ${started.error?.message||started.error?.code||init.status}`);
  const uploaded=await fetch(started.data.upload_url,{method:"PUT",headers:{"content-type":contentType,"content-length":String(size),"content-range":`bytes 0-${size-1}/${size}`},body:object.body});
  if(!uploaded.ok)throw new BookingError(502,"TIKTOK_UPLOAD_FAILED",`Das Video konnte nicht zu TikTok übertragen werden (${uploaded.status}).`);
  return{publishId:started.data.publish_id};
}
