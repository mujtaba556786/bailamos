import { BookingError } from "./booking-policy.ts";
import { decrypt,digest,encrypt } from "./social-crypto.ts";

const provider = "youtube";
const scope = "https://www.googleapis.com/auth/youtube.upload";
const callbackUrl = "https://bailamos-waldcafe.de/api/social/youtube/callback";

type YoutubeEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  YOUTUBE_CLIENT_ID?: string;
  YOUTUBE_CLIENT_SECRET?: string;
  SOCIAL_TOKEN_ENCRYPTION_KEY?: string;
};

type TokenResponse = {access_token:string;expires_in:number;refresh_token?:string;scope?:string;token_type:string};
type StoredConnection = {access_token_encrypted:string;refresh_token_encrypted:string|null;expires_at:number;account_label:string;scope:string};

function requireConfig(env:YoutubeEnv){
  if(!env.DB||!env.YOUTUBE_CLIENT_ID||!env.YOUTUBE_CLIENT_SECRET||!env.SOCIAL_TOKEN_ENCRYPTION_KEY)throw new BookingError(503,"YOUTUBE_NOT_CONFIGURED","YouTube ist noch nicht vollständig eingerichtet.");
  return {db:env.DB,clientId:env.YOUTUBE_CLIENT_ID,clientSecret:env.YOUTUBE_CLIENT_SECRET,encryptionKey:env.SOCIAL_TOKEN_ENCRYPTION_KEY};
}

export async function createYoutubeAuthorization(env:YoutubeEnv){
  const {db,clientId}=requireConfig(env),state=crypto.randomUUID()+crypto.randomUUID(),now=Date.now();
  await db.prepare("DELETE FROM social_oauth_states WHERE expires_at < ?").bind(now).run();
  await db.prepare("INSERT INTO social_oauth_states (state_hash,provider,expires_at,created_at) VALUES (?,?,?,?)").bind(await digest(state),provider,now+10*60*1000,new Date(now).toISOString()).run();
  const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",clientId);url.searchParams.set("redirect_uri",callbackUrl);url.searchParams.set("response_type","code");url.searchParams.set("scope",scope);url.searchParams.set("access_type","offline");url.searchParams.set("prompt","consent");url.searchParams.set("include_granted_scopes","true");url.searchParams.set("state",state);
  return url.toString();
}

export async function finishYoutubeAuthorization(env:YoutubeEnv,code:string,state:string){
  const {db,clientId,clientSecret,encryptionKey:key}=requireConfig(env),stateHash=await digest(state),now=Date.now();
  const saved=await db.prepare("SELECT expires_at FROM social_oauth_states WHERE state_hash=? AND provider=?").bind(stateHash,provider).first<{expires_at:number}>();
  await db.prepare("DELETE FROM social_oauth_states WHERE state_hash=?").bind(stateHash).run();
  if(!saved||saved.expires_at<now)throw new BookingError(400,"INVALID_OAUTH_STATE","Die YouTube-Verbindung ist abgelaufen. Bitte erneut im Dashboard starten.");
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:callbackUrl,grant_type:"authorization_code"})});
  const tokens=await response.json() as TokenResponse&{error?:string;error_description?:string};
  if(!response.ok||!tokens.access_token)throw new BookingError(502,"YOUTUBE_AUTH_FAILED",tokens.error_description||tokens.error||"YouTube konnte nicht verbunden werden.");
  const previous=await db.prepare("SELECT refresh_token_encrypted FROM social_connections WHERE provider=?").bind(provider).first<{refresh_token_encrypted:string|null}>();
  const stamp=new Date(now).toISOString(),access=await encrypt(tokens.access_token,key),refresh=tokens.refresh_token?await encrypt(tokens.refresh_token,key):previous?.refresh_token_encrypted||null;
  await db.prepare("INSERT INTO social_connections (provider,access_token_encrypted,refresh_token_encrypted,expires_at,scope,account_label,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(provider) DO UPDATE SET access_token_encrypted=excluded.access_token_encrypted,refresh_token_encrypted=excluded.refresh_token_encrypted,expires_at=excluded.expires_at,scope=excluded.scope,account_label=excluded.account_label,updated_at=excluded.updated_at").bind(provider,access,refresh,now+tokens.expires_in*1000,tokens.scope||scope,"Bailamos Waldcafé",stamp,stamp).run();
}

export async function youtubeConnectionStatus(env:YoutubeEnv){
  if(!env.DB||!env.YOUTUBE_CLIENT_ID||!env.YOUTUBE_CLIENT_SECRET||!env.SOCIAL_TOKEN_ENCRYPTION_KEY)return{configured:false,connected:false};
  const row=await env.DB.prepare("SELECT account_label,updated_at FROM social_connections WHERE provider=?").bind(provider).first<{account_label:string;updated_at:string}>();
  return{configured:true,connected:Boolean(row),accountLabel:row?.account_label||"",updatedAt:row?.updated_at||null};
}

async function accessToken(env:YoutubeEnv){
  const {db,clientId,clientSecret,encryptionKey:key}=requireConfig(env),row=await db.prepare("SELECT access_token_encrypted,refresh_token_encrypted,expires_at,account_label,scope FROM social_connections WHERE provider=?").bind(provider).first<StoredConnection>();
  if(!row)throw new BookingError(409,"YOUTUBE_NOT_CONNECTED","Bitte zuerst das YouTube-Konto verbinden.");
  if(row.expires_at>Date.now()+60000)return decrypt(row.access_token_encrypted,key);
  if(!row.refresh_token_encrypted)throw new BookingError(409,"YOUTUBE_RECONNECT","Die YouTube-Verbindung muss erneuert werden.");
  const refreshToken=await decrypt(row.refresh_token_encrypted,key),response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:"refresh_token"})}),tokens=await response.json() as TokenResponse&{error?:string;error_description?:string};
  if(!response.ok||!tokens.access_token)throw new BookingError(502,"YOUTUBE_REFRESH_FAILED",tokens.error_description||"YouTube-Verbindung konnte nicht erneuert werden.");
  await db.prepare("UPDATE social_connections SET access_token_encrypted=?,expires_at=?,updated_at=? WHERE provider=?").bind(await encrypt(tokens.access_token,key),Date.now()+tokens.expires_in*1000,new Date().toISOString(),provider).run();
  return tokens.access_token;
}

export async function publishYoutubeVideo(env:YoutubeEnv,campaign:{title:string;captionDe:string;captionEn:string;language:"de"|"en";mediaUrl:string;mediaKind:string}){
  if(!env.BUCKET)throw new BookingError(503,"MEDIA_UNAVAILABLE","Medienspeicher ist nicht verfügbar.");
  if(campaign.mediaKind!=="video")throw new BookingError(400,"YOUTUBE_VIDEO_REQUIRED","YouTube benötigt ein Video. Bitte MP4 oder WebM hochladen.");
  const prefix="/api/media/";if(!campaign.mediaUrl.startsWith(prefix))throw new BookingError(400,"INVALID_MEDIA","Bitte ein hochgeladenes Video verwenden.");
  const objectKey=decodeURIComponent(campaign.mediaUrl.slice(prefix.length)),object=await env.BUCKET.get(objectKey);
  if(!object)throw new BookingError(404,"MEDIA_NOT_FOUND","Das Kampagnenvideo wurde nicht gefunden.");
  const contentType=object.httpMetadata?.contentType||"application/octet-stream";
  if(!["video/mp4","video/webm"].includes(contentType))throw new BookingError(400,"YOUTUBE_VIDEO_REQUIRED","YouTube benötigt ein MP4- oder WebM-Video.");
  const token=await accessToken(env),description=campaign.language==="de"?campaign.captionDe:campaign.captionEn;
  const start=await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json; charset=UTF-8","x-upload-content-length":String(object.size),"x-upload-content-type":contentType},body:JSON.stringify({snippet:{title:campaign.title.slice(0,100),description:description.slice(0,5000),categoryId:"22"},status:{privacyStatus:"private",selfDeclaredMadeForKids:false}})});
  if(!start.ok){const error=await start.text();throw new BookingError(502,"YOUTUBE_UPLOAD_FAILED",`YouTube hat den Upload abgelehnt (${start.status}). ${error.slice(0,300)}`)}
  const location=start.headers.get("location");if(!location)throw new BookingError(502,"YOUTUBE_UPLOAD_FAILED","YouTube hat keine Upload-Adresse zurückgegeben.");
  const uploaded=await fetch(location,{method:"PUT",headers:{"content-type":contentType,"content-length":String(object.size)},body:object.body}),result=await uploaded.json() as {id?:string;error?:{message?:string}};
  if(!uploaded.ok||!result.id)throw new BookingError(502,"YOUTUBE_UPLOAD_FAILED",result.error?.message||"Das Video konnte nicht zu YouTube hochgeladen werden.");
  return{id:result.id,url:`https://www.youtube.com/watch?v=${result.id}`,privacyStatus:"private"};
}
