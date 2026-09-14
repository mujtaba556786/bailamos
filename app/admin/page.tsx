"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Check, ChevronRight, Clock3, KeyRound, Loader2, LogOut, Mail, Phone, RefreshCw, Search, ShieldCheck, TableProperties, UserRound, Users, X } from "lucide-react";
import { berlinDate } from "../../lib/booking-policy";
import tables from "../../data/tables.json";
import { AdminContent } from "../../components/admin-content";
import { AdminMenu } from "../../components/admin-menu";
import { AdminOperations } from "../../components/admin-operations";
import { AdminSeo } from "../../components/admin-seo";

type Status = "pending"|"confirmed"|"declined"|"cancelled"|"arrived"|"seated"|"completed"|"no_show";
type Reservation = {
  id:string; status:Status; version:number; date:string; time:string; guest_count:number; table_id:string;
  customer_name:string; customer_phone:string; customer_email:string; occasion:string; dietary:string; notes:string;
  newsletter_opt_in?:number; table_name?:string; created_at:string; updated_at?:string; change_reason?:string;
};
type Event = {previous_status:string|null;status:Status;actor:string;reason:string;version:number;created_at:string};
const labels:Record<Status,string>={pending:"Ausstehend",confirmed:"Bestätigt",declined:"Abgelehnt",cancelled:"Storniert",arrived:"Angekommen",seated:"Platziert",completed:"Abgeschlossen",no_show:"Nicht erschienen"};
const tones:Record<Status,string>={pending:"bg-amber-100 text-amber-800",confirmed:"bg-emerald-100 text-emerald-800",declined:"bg-rose-100 text-rose-800",cancelled:"bg-slate-100 text-slate-600",arrived:"bg-blue-100 text-blue-800",seated:"bg-indigo-100 text-indigo-800",completed:"bg-[#e4dfd4] text-[#425148]",no_show:"bg-zinc-200 text-zinc-700"};
const nextStates:Record<Status,Status[]>={pending:["confirmed","declined","cancelled"],confirmed:["arrived","cancelled","no_show"],arrived:["seated","cancelled","no_show"],seated:["completed"],declined:[],cancelled:[],completed:[],no_show:[]};
const tableName=(id:string,name?:string)=>name||tables.find(table=>table.id===id)?.area.de || id;
function localDate(date:string){return new Intl.DateTimeFormat("de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Berlin"}).format(new Date(date+"T12:00:00Z"))}
function StatusBadge({status}:{status:Status}){return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[status]}`}>{labels[status]}</span>}

export default function Admin(){
  const [key,setKey]=useState("");
  const [draftKey,setDraftKey]=useState("");
  const [date,setDate]=useState(berlinDate());
  const [reservations,setReservations]=useState<Reservation[]>([]);
  const [selected,setSelected]=useState<Reservation|null>(null);
  const [events,setEvents]=useState<Event[]>([]);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const [authorizing,setAuthorizing]=useState(false);
  const [error,setError]=useState("");
  const [reason,setReason]=useState("");
  const [pendingStatus,setPendingStatus]=useState<Status|null>(null);
  const [saving,setSaving]=useState(false);
  const [view,setView]=useState<"reservations"|"content"|"menu"|"operations"|"seo">("reservations");

  useEffect(()=>{const saved=sessionStorage.getItem("bailamos-admin-key");if(saved){setKey(saved)}},[]);

  const api=useCallback(async(url:string,options:RequestInit={})=>{
    const response=await fetch(url,{...options,headers:{...options.headers,"x-admin-key":key||draftKey}});
    const result=await response.json() as {error?:string;reservations?:Reservation[];reservation?:Reservation;events?:Event[]};
    if(!response.ok)throw Object.assign(new Error(result.error||"Die Anfrage ist fehlgeschlagen."),{status:response.status});
    return result;
  },[key,draftKey]);

  const load=useCallback(async(chosenDate=date,accessKey=key)=>{
    if(!accessKey)return;
    setLoading(true);setError("");
    try{
      const response=await fetch(`/api/admin/reservations?date=${chosenDate}`,{headers:{"x-admin-key":accessKey}});
      const result=await response.json() as {error?:string;reservations?:Reservation[]};
      if(!response.ok)throw Object.assign(new Error(result.error||"Reservierungen konnten nicht geladen werden."),{status:response.status});
      setReservations(result.reservations||[]);
    }catch(cause){
      if((cause as {status?:number}).status===401){sessionStorage.removeItem("bailamos-admin-key");setKey("");}
      setError(cause instanceof Error?cause.message:"Reservierungen konnten nicht geladen werden.");
    }finally{setLoading(false);setAuthorizing(false)}
  },[date,key]);

  useEffect(()=>{if(!key)return;void load(date,key);const timer=window.setInterval(()=>void load(date,key),30000);return()=>window.clearInterval(timer)},[key,date,load]);

  async function signIn(event:React.FormEvent){
    event.preventDefault();setAuthorizing(true);setError("");
    try{
      const response=await fetch(`/api/admin/reservations?date=${date}`,{headers:{"x-admin-key":draftKey}});
      const result=await response.json() as {error?:string;reservations?:Reservation[]};
      if(!response.ok)throw new Error(result.error||"Zugang nicht möglich.");
      sessionStorage.setItem("bailamos-admin-key",draftKey);setReservations(result.reservations||[]);setKey(draftKey);setDraftKey("");
    }catch(cause){setError(cause instanceof Error?cause.message:"Zugang nicht möglich.");}
    finally{setAuthorizing(false)}
  }

  async function open(reservation:Reservation){
    setSelected(reservation);setEvents([]);setError("");setReason("");setPendingStatus(null);
    try{const result=await api(`/api/admin/reservations?id=${encodeURIComponent(reservation.id)}`);setSelected(result.reservation||reservation);setEvents(result.events||[])}
    catch(cause){setError(cause instanceof Error?cause.message:"Details konnten nicht geladen werden.")}
  }

  async function updateStatus(status:Status){
    if(!selected)return;
    if(["declined","cancelled"].includes(status)&&!reason.trim()){setPendingStatus(status);return}
    setSaving(true);setError("");
    try{
      await api("/api/admin/reservations",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:selected.id,status,version:selected.version,reason:reason.trim()})});
      const next={...selected,status,version:selected.version+1,change_reason:reason.trim()};
      setSelected(next);setReservations(current=>current.map(item=>item.id===next.id?next:item));setReason("");setPendingStatus(null);
      await open(next);
    }catch(cause){setError(cause instanceof Error?cause.message:"Status konnte nicht geändert werden.");await load()}
    finally{setSaving(false)}
  }

  const shown=useMemo(()=>reservations.filter(item=>`${item.customer_name} ${item.customer_email} ${item.customer_phone} ${item.id}`.toLowerCase().includes(query.toLowerCase())),[reservations,query]);
  const active=reservations.filter(item=>!["declined","cancelled","completed","no_show"].includes(item.status));
  const counts={pending:reservations.filter(item=>item.status==="pending").length,confirmed:reservations.filter(item=>item.status==="confirmed").length,guests:active.reduce((sum,item)=>sum+item.guest_count,0)};

  if(!key)return <main className="grid min-h-screen place-items-center bg-[#0b1712] px-5 text-[#f5e8d3]"><section className="w-full max-w-md rounded-[2rem] border border-[#c68a3b]/30 bg-white/5 p-7 shadow-2xl sm:p-9"><Link href="/" className="flex items-center gap-3"><Image src="/bailamos-logo.jpg" width={52} height={52} alt="Bailamos" className="h-12 w-12 rounded-full object-cover"/><div><p className="font-display text-2xl">BAILAMOS</p><p className="text-sm text-white/45">Restaurantverwaltung</p></div></Link><span className="mt-10 grid h-12 w-12 place-items-center rounded-full bg-[#d6a45f] text-[#10261e]"><ShieldCheck size={24}/></span><h1 className="font-display mt-5 text-4xl">Sicherer Zugang</h1><p className="mt-3 text-base leading-7 text-white/60">Geben Sie den Administrationsschlüssel ein. Er bleibt nur für diese Browsersitzung gespeichert.</p><form onSubmit={signIn} className="mt-7"><label className="grid gap-2 text-base">Administrationsschlüssel<div className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-black/20 px-4"><KeyRound size={18} className="text-[#d6a45f]"/><input required type="password" autoComplete="current-password" value={draftKey} onChange={e=>setDraftKey(e.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" /></div></label>{error&&<p role="alert" className="mt-4 rounded-xl bg-red-950/40 p-4 text-red-200">{error}</p>}<button disabled={authorizing} className="button-primary mt-6 w-full">{authorizing?<Loader2 className="animate-spin" size={18}/>:<KeyRound size={18}/>}Dashboard öffnen</button></form></section></main>;

  return <main className="min-h-screen bg-[#f4f0e8] text-[#10261e]">
    <header className="border-b border-[#10261e]/10 bg-[#0b1712] px-4 py-4 text-[#f5e8d3] sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5"><Link href="/" className="flex items-center gap-3"><Image src="/bailamos-logo.jpg" width={48} height={48} alt="Bailamos" className="h-11 w-11 rounded-full object-cover"/><div><p className="font-display text-xl">BAILAMOS</p><p className="text-xs text-white/45">Reservierungen</p></div></Link><button onClick={()=>{sessionStorage.removeItem("bailamos-admin-key");setKey("");setReservations([])}} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm text-white/70 hover:bg-white/10"><LogOut size={17}/> <span className="hidden sm:inline">Abmelden</span></button></div>
    </header>
    <nav aria-label="Verwaltungsbereiche" className="border-b border-[#10261e]/10 bg-white px-4 sm:px-8"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto py-2">{[["reservations","Reservierungen"],["content","Content & Marketing"],["menu","Speisekarte"],["operations","Tische & Einstellungen"],["seo","SEO & AI"]].map(([id,label])=><button key={id} onClick={()=>setView(id as typeof view)} className={`min-h-11 whitespace-nowrap rounded-full px-5 text-sm font-semibold ${view===id?"bg-[#10261e] text-white":"text-[#10261e]/60 hover:bg-[#f4f0e8]"}`}>{label}</button>)}</div></nav>
    {view==="reservations"?<div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Restaurantbetrieb</p><h1 className="font-display mt-2 text-4xl sm:text-5xl">Reservierungen</h1><p className="mt-2 text-base text-[#10261e]/55">{localDate(date)}</p></div><div className="flex gap-2"><label className="grid text-sm"><span className="sr-only">Datum</span><input type="date" value={date} onChange={e=>{setDate(e.target.value);setSelected(null)}} className="min-h-12 rounded-xl border border-[#10261e]/15 bg-white px-4 text-base"/></label><button onClick={()=>load()} aria-label="Aktualisieren" className="grid h-12 w-12 place-items-center rounded-xl border border-[#10261e]/15 bg-white hover:bg-[#fff8ec]"><RefreshCw size={18} className={loading?"animate-spin":""}/></button></div></section>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[[CalendarDays,String(reservations.length),"Reservierungen"],[AlertCircle,String(counts.pending),"Offen"],[Check,String(counts.confirmed),"Bestätigt"],[Users,String(counts.guests),"Erwartete Gäste"]].map(([Icon,value,label])=><div key={label as string} className="rounded-2xl bg-white p-5 shadow-sm"><Icon size={20} className="text-[#b8782e]"/><p className="mt-4 text-3xl font-semibold">{value as string}</p><p className="mt-1 text-sm text-[#10261e]/50">{label as string}</p></div>)}
      </section>

      <section className="mt-6 grid min-h-[520px] overflow-hidden rounded-[2rem] bg-white shadow-sm lg:grid-cols-[.9fr_1.1fr]">
        <div className="border-b border-[#10261e]/10 lg:border-b-0 lg:border-r">
          <div className="border-b border-[#10261e]/10 p-5"><label className="flex min-h-12 items-center gap-3 rounded-xl bg-[#f4f0e8] px-4"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Reservierungen suchen" placeholder="Name, E-Mail oder Nummer" className="min-w-0 flex-1 bg-transparent text-base outline-none"/></label></div>
          {loading?<div className="grid min-h-72 place-items-center text-[#10261e]/50"><Loader2 className="animate-spin" size={28}/></div>:error&&!reservations.length?<div className="p-8 text-center"><AlertCircle className="mx-auto text-[#a52520]" size={30}/><p className="mt-4">{error}</p><button onClick={()=>load()} className="mt-4 text-[#a52520] underline">Erneut versuchen</button></div>:shown.length?<div className="divide-y divide-[#10261e]/10">{shown.map(item=><button key={item.id} onClick={()=>open(item)} className={`grid w-full grid-cols-[62px_1fr_auto] items-center gap-3 p-5 text-left transition hover:bg-[#fff8ec] ${selected?.id===item.id?"bg-[#fff8ec]":""}`}><strong className="text-lg">{item.time}</strong><span className="min-w-0"><span className="block truncate font-semibold">{item.customer_name}</span><span className="mt-1 block text-sm text-[#10261e]/50">{item.guest_count} Gäste · {tableName(item.table_id,item.table_name)}</span></span><span className="flex items-center gap-2"><StatusBadge status={item.status}/><ChevronRight size={16} className="hidden text-[#10261e]/30 sm:block"/></span></button>)}</div>:<div className="grid min-h-72 place-items-center p-8 text-center"><div><CalendarDays className="mx-auto text-[#c68a3b]" size={32}/><p className="mt-4 font-semibold">Keine Reservierungen</p><p className="mt-1 text-sm text-[#10261e]/50">Für diesen Tag sind noch keine Anfragen vorhanden.</p></div></div>}
        </div>

        <div className={`${selected?"fixed inset-0 z-50 overflow-y-auto bg-white lg:static lg:z-auto":"hidden lg:grid"} lg:block`}>
          {!selected?<div className="grid h-full min-h-[520px] place-items-center p-8 text-center"><div><UserRound className="mx-auto text-[#c68a3b]" size={36}/><h2 className="font-display mt-4 text-3xl">Reservierung auswählen</h2><p className="mt-2 max-w-sm text-[#10261e]/50">Öffnen Sie links eine Reservierung, um Kontaktdaten, Wünsche und Aktionen zu sehen.</p></div></div>:<article className="p-5 sm:p-8">
            <div className="flex items-start justify-between gap-5"><div><StatusBadge status={selected.status}/><h2 className="font-display mt-3 text-4xl">{selected.customer_name}</h2><p className="mt-1 text-sm text-[#10261e]/45">{selected.id}</p></div><button onClick={()=>setSelected(null)} aria-label="Details schließen" className="grid h-11 w-11 place-items-center rounded-full bg-[#f4f0e8]"><X size={20}/></button></div>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f4f0e8] p-4"><Clock3 size={18} className="text-[#b8782e]"/><strong className="mt-3 block">{selected.time} Uhr</strong><span className="text-sm text-[#10261e]/50">{selected.date}</span></div><div className="rounded-xl bg-[#f4f0e8] p-4"><Users size={18} className="text-[#b8782e]"/><strong className="mt-3 block">{selected.guest_count} Gäste</strong><span className="text-sm text-[#10261e]/50">{tableName(selected.table_id,selected.table_name)}</span></div><div className="col-span-2 rounded-xl bg-[#f4f0e8] p-4 sm:col-span-1"><TableProperties size={18} className="text-[#b8782e]"/><strong className="mt-3 block">{selected.newsletter_opt_in?"Ja":"Nein"}</strong><span className="text-sm text-[#10261e]/50">Newsletter-Wunsch</span></div></div>
            <div className="mt-7 border-t border-[#10261e]/10 pt-6"><h3 className="font-semibold">Kontakt</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><a href={`tel:${selected.customer_phone}`} className="flex min-h-12 items-center gap-3 rounded-xl border px-4 hover:bg-[#fff8ec]"><Phone size={17}/><span className="truncate">{selected.customer_phone}</span></a><a href={`mailto:${selected.customer_email}`} className="flex min-h-12 items-center gap-3 rounded-xl border px-4 hover:bg-[#fff8ec]"><Mail size={17}/><span className="truncate">{selected.customer_email}</span></a></div></div>
            <div className="mt-7 border-t border-[#10261e]/10 pt-6"><h3 className="font-semibold">Wünsche und Hinweise</h3><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-[#10261e]/45">Anlass</dt><dd className="mt-1 text-base">{selected.occasion||"Keine Angabe"}</dd></div><div><dt className="text-[#10261e]/45">Ernährung</dt><dd className="mt-1 text-base">{selected.dietary||"Keine Angabe"}</dd></div><div className="sm:col-span-2"><dt className="text-[#10261e]/45">Notizen</dt><dd className="mt-1 whitespace-pre-wrap text-base">{selected.notes||"Keine Notizen"}</dd></div></dl></div>
            {!!nextStates[selected.status].length&&<div className="mt-7 border-t border-[#10261e]/10 pt-6"><h3 className="font-semibold">Nächster Schritt</h3><div className="mt-4 flex flex-wrap gap-3">{nextStates[selected.status].filter(status=>!["declined","cancelled"].includes(status)).map(status=><button disabled={saving} key={status} onClick={()=>updateStatus(status)} className="min-h-11 rounded-full bg-[#10261e] px-5 text-sm font-semibold text-white disabled:opacity-50">{labels[status]}</button>)}{nextStates[selected.status].filter(status=>["declined","cancelled"].includes(status)).map(status=><button disabled={saving} key={status} onClick={()=>{setPendingStatus(status);setReason("")}} className="min-h-11 rounded-full border border-[#a52520]/35 px-5 text-sm font-semibold text-[#a52520] disabled:opacity-50">{labels[status]}</button>)}</div></div>}
            {pendingStatus&&<div className="mt-5 rounded-2xl border border-[#a52520]/25 bg-red-50 p-5"><label className="grid gap-2 font-semibold">Grund für „{labels[pendingStatus]}“<textarea autoFocus value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} rows={3} className="rounded-xl border bg-white px-4 py-3 font-normal"/></label><div className="mt-4 flex gap-3"><button onClick={()=>setPendingStatus(null)} className="min-h-11 rounded-full border px-5 text-sm">Abbrechen</button><button disabled={!reason.trim()||saving} onClick={()=>updateStatus(pendingStatus)} className="min-h-11 rounded-full bg-[#a52520] px-5 text-sm font-semibold text-white disabled:opacity-50">Änderung bestätigen</button></div></div>}
            {error&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
            <div className="mt-7 border-t border-[#10261e]/10 pt-6"><h3 className="font-semibold">Verlauf</h3>{events.length?<ol className="mt-4 space-y-4">{events.map(event=><li key={event.version} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c68a3b]"/><div><p><strong>{labels[event.status]}</strong> · {event.actor==="customer"?"Gast":event.actor==="owner"?"Restaurant":"System"}</p>{event.reason&&<p className="mt-1 text-[#10261e]/55">{event.reason}</p>}<p className="mt-1 text-xs text-[#10261e]/40">{new Date(event.created_at).toLocaleString("de-DE")}</p></div></li>)}</ol>:<p className="mt-3 text-sm text-[#10261e]/45">Noch kein Verlauf verfügbar.</p>}</div>
          </article>}
        </div>
      </section>
    </div>:view==="content"?<AdminContent adminKey={key}/>:view==="menu"?<AdminMenu adminKey={key}/>:view==="operations"?<AdminOperations adminKey={key}/>:<AdminSeo adminKey={key}/>}
  </main>;
}
