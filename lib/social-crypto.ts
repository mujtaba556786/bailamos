// Shared helpers for storing social platform tokens encrypted at rest (AES-GCM).
export function bytesToBase64(bytes:Uint8Array){let value="";for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value)}
export function base64ToBytes(value:string){const raw=atob(value);return Uint8Array.from(raw,character=>character.charCodeAt(0))}
export async function digest(value:string){return bytesToBase64(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))))}
async function encryptionKey(secret:string){return crypto.subtle.importKey("raw",await crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret)),"AES-GCM",false,["encrypt","decrypt"])}
export async function encrypt(value:string,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},await encryptionKey(secret),new TextEncoder().encode(value));return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipher))}`}
export async function decrypt(value:string,secret:string){const [iv,cipher]=value.split(".");if(!iv||!cipher)throw new Error("Invalid encrypted value");const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:base64ToBytes(iv)},await encryptionKey(secret),base64ToBytes(cipher));return new TextDecoder().decode(plain)}
