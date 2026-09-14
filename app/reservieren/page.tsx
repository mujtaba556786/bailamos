"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Copy, Users } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { addDays, berlinDate } from "../../lib/booking-policy";
import type { TableConfig } from "../../lib/operations-config";
import { withLocale,type Locale } from "../../lib/i18n";

type Result = { error?: string; tables?: TableConfig[]; times?:string[]; maxGuests?:number; horizonDays?:number; reservation?: { id: string }; cancellationToken?: string };
const emptyDetails = { name: "", phone: "", email: "", occasion: "", dietary: "", notes: "" };

export function ReservationExperience({locale}:{locale:Locale}) {
  const L=(de:string,en:string)=>locale==="en"?en:de;
  const today = berlinDate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [selected, setSelected] = useState("restaurant-choice");
  const [tables, setTables] = useState<TableConfig[]>([]);
  const [times,setTimes]=useState<string[]>([]),[maxGuests,setMaxGuests]=useState(4),[horizonDays,setHorizonDays]=useState(180),[slotsLoading,setSlotsLoading]=useState(true);
  const [details, setDetails] = useState(emptyDetails);
  const [newsletter, setNewsletter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [manageUrl, setManageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const attempts = useRef(new Map<string, string>());
  const selectedTime = times.includes(time) ? time : times[0] || "";
  const chosen = tables.find(table => table.id === selected);
  const bookable = tables;

  useEffect(()=>{let active=true;setSlotsLoading(true);setError("");fetch(`/api/reservations?date=${date}&guests=${guests}`).then(async response=>{const result=await response.json() as Result;if(!response.ok)throw new Error(result.error);if(active){setTimes(result.times||[]);setMaxGuests(result.maxGuests||4);setHorizonDays(result.horizonDays||180);setTime(current=>(result.times||[]).includes(current)?current:result.times?.[0]||"")}}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:"Termine konnten nicht geladen werden.")}).finally(()=>{if(active)setSlotsLoading(false)});return()=>{active=false}},[date,guests]);

  async function findTables() {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/reservations?date=${date}&time=${selectedTime}&guests=${guests}`);
      const result = await response.json() as Result;
      if (!response.ok) throw new Error(result.error);
      const choices = result.tables || [];
      setTables(choices); setTime(selectedTime); setSelected("restaurant-choice");
      if (!choices.length) throw new Error(L("Zu diesem Termin ist leider kein Tisch frei. Bitte wählen Sie eine andere Uhrzeit.","No table is available at this time. Please choose another time."));
      setStep(2);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L("Die Verfügbarkeit konnte nicht geladen werden.","Availability could not be loaded."));
    } finally { setSaving(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    const payload = JSON.stringify({ date, time: selectedTime, guestCount: guests, tableId: selected, customer: { name: details.name, phone: details.phone, email: details.email }, occasion: details.occasion, dietary: details.dietary, notes: details.notes, marketingConsent: newsletter });
    let key = attempts.current.get(payload);
    if (!key) { key = crypto.randomUUID(); attempts.current.set(payload, key); }
    try {
      const response = await fetch("/api/reservations", { method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": key }, body: payload });
      const result = await response.json() as Result;
      if (!response.ok || !result.reservation || !result.cancellationToken) throw new Error(result.error || L("Die Reservierung konnte nicht gespeichert werden.","The reservation could not be saved."));
      const url = `${window.location.origin}/reservierungen/${result.reservation.id}/stornieren?token=${encodeURIComponent(result.cancellationToken)}${locale==="en"?"&lang=en":""}`;
      setId(result.reservation.id); setManageUrl(url); setStep(3);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L("Die Verbindung wurde unterbrochen. Bitte erneut versuchen – Ihre Anfrage wird nicht doppelt gespeichert.","The connection was interrupted. Please try again—your request will not be duplicated."));
    } finally { setSaving(false); }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(manageUrl);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  return <main className="min-h-screen bg-[#0b1712] text-[#f5e8d3]">
    <SiteHeader active="Reservieren" />
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10 lg:px-10">
      {step < 3 && <header className="mx-auto mb-7 flex max-w-6xl items-end justify-between gap-5">
        <div><p className="eyebrow">{L("Tisch reservieren","Reserve a table")}</p><h1 className="font-display mt-2 text-4xl sm:text-5xl">{L("Ihr Abend bei Bailamos","Your evening at Bailamos")}</h1></div>
        <p className="shrink-0 text-sm text-white/55">{L("Schritt","Step")} {step} {L("von","of")} 2</p>
      </header>}

      {step === 1 && <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-[#c68a3b]/25 bg-[#fff8ec] text-[#10261e] shadow-2xl lg:grid-cols-[.8fr_1.2fr]">
        <div className="relative min-h-64 lg:min-h-[590px]">
          <Image src="/table-corner.webp" alt={L("Gemütlicher Tisch im Bailamos","Cosy table at Bailamos")} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10261e]/90 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9"><p className="font-display text-3xl">{L("Mexikanischer Genuss,","Mexican flavours,")}<br />{L("für Sie reserviert.","reserved for you.")}</p><p className="mt-3 max-w-sm text-base text-white/70">{L("Wählen Sie Ihren Termin. Wir zeigen nur Tische, die wirklich verfügbar sind.","Choose your date and time. We only show tables that are genuinely available.")}</p></div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <h2 className="font-display text-4xl">{L("Wann kommen Sie?","When are you coming?")}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-base font-medium"><span className="flex items-center gap-2"><CalendarDays size={18} /> {L("Datum","Date")}</span><input value={date} min={today} max={addDays(today, horizonDays)} onChange={event => { setDate(event.target.value); setTime(""); setError(""); }} type="date" className="min-h-14 rounded-xl border border-[#10261e]/15 bg-white px-4 text-base" /></label>
            <label className="grid gap-2 text-base font-medium"><span className="flex items-center gap-2"><Clock3 size={18} /> {L("Uhrzeit","Time")}</span><select value={selectedTime} onChange={event => setTime(event.target.value)} className="min-h-14 rounded-xl border border-[#10261e]/15 bg-white px-4 text-base">{!times.length && <option value="">{L("Keine Termine verfügbar","No times available")}</option>}{times.map(value => <option key={value} value={value}>{value}{locale==="de"?" Uhr":""}</option>)}</select></label>
            <label className="grid gap-2 text-base font-medium sm:col-span-2"><span className="flex items-center gap-2"><Users size={18} /> {L("Gäste","Guests")}</span><select value={guests} onChange={event => { setGuests(Number(event.target.value)); setError(""); }} className="min-h-14 rounded-xl border border-[#10261e]/15 bg-white px-4 text-base">{Array.from({ length: 8 }, (_, index) => index + 1).map(value => <option key={value} value={value}>{value} {value === 1 ? L("Person","person") : L("Personen","people")}</option>)}</select></label>
          </div>
          {guests > maxGuests && <p role="status" className="mt-5 rounded-xl bg-[#fff0d6] p-4 text-base">{L(`Online sind aktuell bis zu ${maxGuests} Personen möglich. Größere Gruppen stimmen Sie bitte direkt mit dem Restaurant ab.`,`Online booking currently supports up to ${maxGuests} guests. Please contact the restaurant directly for larger groups.`)}</p>}
          {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-base text-red-700">{error}</p>}
          <button disabled={saving || slotsLoading || !selectedTime || guests > maxGuests} onClick={findTables} className="mt-7 flex min-h-14 w-full items-center justify-between rounded-full bg-[#a52520] px-6 font-semibold text-white transition hover:bg-[#bf3029] disabled:cursor-not-allowed disabled:opacity-45">{saving ? L("Verfügbarkeit wird geprüft…","Checking availability…") : L("Verfügbare Tische ansehen","View available tables")}<ArrowRight size={19} /></button>
          <p className="mt-4 text-center text-sm text-[#10261e]/55">{L("Unverbindliche Anfrage · Bestätigung folgt durch das Restaurant","Reservation request · The restaurant will confirm it")}</p>
        </div>
      </section>}

      {step === 2 && <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section>
          <button type="button" onClick={() => { setStep(1); setError(""); }} className="mb-5 inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft size={17} /> {L("Termin ändern","Change date or time")}</button>
          <div className="rounded-[2rem] bg-[#fff8ec] p-6 text-[#10261e] sm:p-9">
            <h2 className="font-display text-4xl">{L("Tisch & Kontaktdaten","Table & contact details")}</h2>
            <p className="mt-2 text-base text-[#10261e]/60">{date} · {selectedTime}{locale==="de"?" Uhr":""} · {guests} {guests === 1 ? L("Person","person") : L("Personen","people")}</p>
            <fieldset className="mt-7"><legend className="text-base font-semibold">{L("Wo möchten Sie sitzen?","Where would you like to sit?")}</legend>
              <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3">
                <button type="button" onClick={() => setSelected("restaurant-choice")} aria-pressed={selected === "restaurant-choice"} className={`min-w-[220px] snap-start rounded-2xl border p-5 text-left transition ${selected === "restaurant-choice" ? "border-[#a52520] bg-[#fff0de] ring-2 ring-[#a52520]/15" : "border-[#10261e]/15 bg-white"}`}><CheckCircle2 size={22} className={selected === "restaurant-choice" ? "text-[#a52520]" : "text-[#10261e]/30"} /><strong className="mt-5 block text-lg">{L("Beste Auswahl","Best available")}</strong><span className="mt-1 block text-sm text-[#10261e]/60">{L("Wir wählen den passendsten freien Tisch.","We choose the most suitable available table.")}</span></button>
                {bookable.map(table => <button type="button" key={table.id} onClick={() => setSelected(table.id)} aria-pressed={selected === table.id} className={`min-w-[235px] snap-start overflow-hidden rounded-2xl border bg-white text-left transition ${selected === table.id ? "border-[#a52520] ring-2 ring-[#a52520]/15" : "border-[#10261e]/15"}`}><div className="relative aspect-[16/9]"><Image src={table.image} fill alt={table.area[locale]} className="object-cover" sizes="235px" /></div><div className="p-4"><strong className="text-lg">{table.area[locale]}</strong><span className="mt-1 block text-sm text-[#10261e]/60">{table.feature[locale]}</span></div></button>)}
              </div>
            </fieldset>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-base">Name<input required autoComplete="name" value={details.name} onChange={e => setDetails({...details,name:e.target.value})} className="min-h-13 rounded-xl border bg-white px-4" /></label>
              <label className="grid gap-2 text-base">{L("Telefon","Phone")}<input required type="tel" autoComplete="tel" value={details.phone} onChange={e => setDetails({...details,phone:e.target.value})} className="min-h-13 rounded-xl border bg-white px-4" /></label>
              <label className="grid gap-2 text-base sm:col-span-2">E-Mail<input required type="email" autoComplete="email" value={details.email} onChange={e => setDetails({...details,email:e.target.value})} className="min-h-13 rounded-xl border bg-white px-4" /></label>
              <label className="grid gap-2 text-base">{L("Anlass","Occasion")}<select value={details.occasion} onChange={e => setDetails({...details,occasion:e.target.value})} className="min-h-13 rounded-xl border bg-white px-4"><option value="">{L("Kein Anlass","No occasion")}</option><option value="birthday">{L("Geburtstag","Birthday")}</option><option value="anniversary">{L("Jahrestag","Anniversary")}</option></select></label>
              <label className="grid gap-2 text-base">{L("Ernährung","Dietary preference")}<select value={details.dietary} onChange={e => setDetails({...details,dietary:e.target.value})} className="min-h-13 rounded-xl border bg-white px-4"><option value="">{L("Keine Angabe","None")}</option><option value="vegetarian">{L("Vegetarisch","Vegetarian")}</option><option value="vegan">Vegan</option></select></label>
              <label className="grid gap-2 text-base sm:col-span-2">{L("Allergien oder Wünsche","Allergies or requests")}<textarea rows={3} value={details.notes} onChange={e => setDetails({...details,notes:e.target.value})} className="rounded-xl border bg-white px-4 py-3" /></label>
            </div>
            <label className="mt-6 flex gap-3 text-base"><input required type="checkbox" className="mt-1 h-5 w-5" /><span>{L("Ich akzeptiere die Reservierungsbedingungen.","I accept the reservation terms.")}</span></label>
            <label className="mt-4 flex gap-3 rounded-2xl border border-[#c68a3b]/30 bg-[#fff3df] p-4 text-base"><input checked={newsletter} onChange={e => setNewsletter(e.target.checked)} type="checkbox" className="mt-1 h-5 w-5" /><span><strong>{L("Events und Angebote erhalten","Receive events and offers")}</strong><span className="mt-1 block text-sm text-[#10261e]/60">{L("Optional. Der Versand wird erst nach Einrichtung des Newsletter-Systems aktiviert.","Optional. Messages begin after the newsletter system is activated.")}</span></span></label>
            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-base text-red-700">{error}</p>}
          </div>
        </section>
        <aside className="h-fit rounded-[2rem] border border-[#c68a3b]/30 bg-[#10261e] p-6 sm:p-8 lg:sticky lg:top-28">
          <p className="eyebrow">{L("Ihre Auswahl","Your selection")}</p><h3 className="font-display mt-3 text-3xl">{chosen ? chosen.area[locale] : L("Tischwahl durch uns","Table selected by us")}</h3>
          <dl className="mt-7 space-y-4 border-y border-white/10 py-6 text-base"><div className="flex justify-between gap-5"><dt className="text-white/55">{L("Datum","Date")}</dt><dd>{date}</dd></div><div className="flex justify-between gap-5"><dt className="text-white/55">{L("Uhrzeit","Time")}</dt><dd>{selectedTime}{locale==="de"?" Uhr":""}</dd></div><div className="flex justify-between gap-5"><dt className="text-white/55">{L("Gäste","Guests")}</dt><dd>{guests}</dd></div></dl>
          <button disabled={saving} className="mt-7 flex min-h-14 w-full items-center justify-between rounded-full bg-[#a52520] px-6 font-semibold text-white hover:bg-[#bf3029] disabled:opacity-50">{saving ? L("Anfrage wird gesendet…","Sending request…") : L("Reservierung anfragen","Request reservation")}<ArrowRight size={19} /></button>
          <p className="mt-4 text-sm leading-6 text-white/50">{L("Sie erhalten zunächst eine Anfragebestätigung. Das Restaurant bestätigt Ihren Tisch anschließend verbindlich.","You will first receive a request confirmation. The restaurant will then confirm your table.")}</p>
        </aside>
      </form>}

      {step === 3 && <section className="mx-auto max-w-2xl py-12 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d6a45f] text-[#10261e]"><Check size={36} /></span>
        <p className="eyebrow mt-8">{L("Anfrage","Request")} {id}</p><h1 className="font-display mt-3 text-5xl sm:text-6xl">{L("Ihre Anfrage ist eingegangen.","Your request has been received.")}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/65">{L("Wir haben Ihre Reservierungsanfrage gespeichert. Der Tisch ist erst nach Bestätigung durch das Restaurant verbindlich reserviert.","We saved your reservation request. Your table is confirmed only after the restaurant accepts it.")}</p>
        <div className="mt-9 rounded-2xl border border-[#c68a3b]/30 bg-white/5 p-6 text-left"><strong className="text-lg">{L("Diesen Link sicher aufbewahren","Keep this link safe")}</strong><p className="mt-2 text-sm leading-6 text-white/55">{L("Damit können Sie Ihre Anfrage später verwalten oder stornieren. Der Link ist persönlich und sollte nicht weitergegeben werden.","Use it to manage or cancel your request later. This link is personal and should not be shared.")}</p><button onClick={copyLink} className="button-secondary mt-5 w-full"><Copy size={17} />{copied ? L("Link kopiert","Link copied") : L("Verwaltungslink kopieren","Copy management link")}</button><Link href={manageUrl} className="mt-4 block text-center text-sm text-[#d6a45f] underline underline-offset-4">{L("Reservierung jetzt verwalten","Manage reservation now")}</Link></div>
        <Link href={withLocale("/",locale)} className="button-primary mt-8">{L("Zur Startseite","Back to home")}</Link>
      </section>}
    </div>
  </main>;
}
export default function Reservation(){return <ReservationExperience locale="de"/>}
