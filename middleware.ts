import { NextResponse, type NextRequest } from 'next/server';
import { env } from 'cloudflare:workers';
import { getMarketingContent } from './lib/marketing-content.ts';
import { openingActive } from './lib/opening.ts';

export async function middleware(request:NextRequest){
  const path=request.nextUrl.pathname.replace(/\/$/,'')||'/';
  // Keep administration, original assets and existing cancellation links accessible.
  if(path==='/admin'||path.startsWith('/admin/')||path.startsWith('/api/')||path.startsWith('/_')||/\.[a-z0-9]+$/i.test(path)||/^\/(en\/)?reservierungen\/[^/]+\/stornieren$/.test(path))return NextResponse.next();
  const {content}=await getMarketingContent(env.DB);
  const active=openingActive(content.opening);
  const english=path==='/en'||path.startsWith('/en/')||request.nextUrl.searchParams.get('lang')==='en';
  if(active&&path!=='/opening'){
    const target=new URL('/opening',request.url);if(english)target.searchParams.set('lang','en');
    const response=NextResponse.redirect(target,307);response.headers.set('Cache-Control','no-store');return response;
  }
  if(!active&&path==='/opening'){const response=NextResponse.redirect(new URL(english?'/en':'/',request.url),307);response.headers.set('Cache-Control','no-store');return response;}
  const response=NextResponse.next();response.headers.set('Cache-Control','no-store');return response;
}
