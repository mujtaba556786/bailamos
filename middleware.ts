import { NextResponse, type NextRequest } from 'next/server';
import { env } from 'cloudflare:workers';
import { getMarketingContent } from './lib/marketing-content.ts';
import { openingActive } from './lib/opening.ts';

const securityHeaders={
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'SAMEORIGIN',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security':'max-age=31536000; includeSubDomains',
  // Report-only: violations are logged in the browser console, nothing is blocked yet.
  // 'unsafe-inline' is needed for the framework's inline scripts; it is tightened later with nonces.
  'Content-Security-Policy-Report-Only':[
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; '),
};

export async function middleware(request:NextRequest){
  const response=await routeRequest(request);
  for(const [name,value] of Object.entries(securityHeaders))response.headers.set(name,value);
  // Administration, booking management and API responses must never appear in search results.
  if(isPrivatePath(request))response.headers.set('X-Robots-Tag','noindex, nofollow');
  return response;
}

const privatePathPattern=/^\/(en\/)?(admin|api|reservierungen)(\/|$)/;
function normalisedPath(request:NextRequest){return request.nextUrl.pathname.replace(/\/$/,'')||'/'}
function isPrivatePath(request:NextRequest){return privatePathPattern.test(normalisedPath(request))}
function isEnglishRequest(request:NextRequest){const path=normalisedPath(request);return path==='/en'||path.startsWith('/en/')||request.nextUrl.searchParams.get('lang')==='en'}

// Passes the request on and tells the layout which language to declare in <html lang>.
function passThrough(request:NextRequest){
  const headers=new Headers(request.headers);
  headers.set('x-bailamos-lang',isEnglishRequest(request)?'en':'de');
  return NextResponse.next({request:{headers}});
}

async function routeRequest(request:NextRequest){
  const path=request.nextUrl.pathname.replace(/\/$/,'')||'/';
  // Keep administration, original assets and existing cancellation links accessible.
  if(path==='/admin'||path.startsWith('/admin/')||path.startsWith('/api/')||path.startsWith('/_')||/\.[a-z0-9]+$/i.test(path)||/^\/(en\/)?reservierungen\/[^/]+\/stornieren$/.test(path))return passThrough(request);
  const {content}=await getMarketingContent(env.DB);
  const active=openingActive(content.opening);
  const english=path==='/en'||path.startsWith('/en/')||request.nextUrl.searchParams.get('lang')==='en';
  if(active&&path!=='/opening'){
    const target=new URL('/opening',request.url);if(english)target.searchParams.set('lang','en');
    const response=NextResponse.redirect(target,307);response.headers.set('Cache-Control','no-store');return response;
  }
  if(!active&&path==='/opening'){const response=NextResponse.redirect(new URL(english?'/en':'/',request.url),307);response.headers.set('Cache-Control','no-store');return response;}
  const response=passThrough(request);response.headers.set('Cache-Control','no-store');return response;
}
