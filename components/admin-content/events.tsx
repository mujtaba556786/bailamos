"use client";
// Sub-tab "Events": one compact row per event, click to edit. Past events sit in a collapsed archive.
import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { berlinToday, eventErrors, eventSlug, eventStatus, groupEvents, type ContentEvent, type EventStatus } from "../../lib/content-admin";
import { AdminConfirmDialog } from "../admin-confirm-dialog";
import type { SectionProps } from "./types";

const statusTone: Record<EventStatus, string> = {
  Entwurf: "bg-[#c68a3b]/15 text-[#8a5a1c]",
  Live: "bg-[#2f6b47]/12 text-[#2f6b47]",
  Vergangen: "bg-[#10261e]/8 text-[#10261e]/55",
};

function formatEventDate(event: ContentEvent) {
  if (!event.date) return "Ohne Datum";
  const date = new Date(`${event.date}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" });
  return event.time ? `${date} · ${event.time}` : date;
}

export function EventsSection({ content, language, change, uploading, uploadMedia, savedIds }: SectionProps & { savedIds: Set<string> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [remove, setRemove] = useState<number | null>(null);
  const today = berlinToday();
  const { upcoming, archive } = useMemo(() => groupEvents(content.events, today), [content.events, today]);

  // Edits one event. A new event (not published yet) keeps its id in step with title and year;
  // a published id never changes, because share links point to it.
  function edit(index: number, mutate: (event: ContentEvent) => void) {
    const before = content.events[index].id;
    const draft = structuredClone(content.events[index]);
    mutate(draft);
    const id = savedIds.has(before) ? before : eventSlug(draft.title.de, draft.date, content.events.filter((_, i) => i !== index).map((item) => item.id));
    change((copy) => { mutate(copy.events[index]); copy.events[index].id = id; });
    if (id !== before && openId === before) setOpenId(id);
  }

  function addEvent() {
    const date = today;
    const id = eventSlug("Neues Event", date, content.events.map((event) => event.id));
    change((copy) => copy.events.unshift({ id, title: { de: "", en: "" }, summary: { de: "", en: "" }, teaser: { de: "", en: "" }, date, time: "19:00", image: "/table-corner.webp", showOnHome: true, featured: false, published: false }));
    setOpenId(id);
  }

  async function uploadImage(index: number, file: File) {
    const result = await uploadMedia(file, "image");
    if (result) change((copy) => { copy.events[index].image = result.url; });
  }

  const row = ({ event, index }: { event: ContentEvent; index: number }) => {
    const open = openId === event.id;
    const status = eventStatus(event, today);
    const errors = eventErrors(event);
    const hasErrors = Object.keys(errors).length > 0;
    const title = event.title[language] || event.title.de;
    return (
      <li key={`event-${index}`} className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <button type="button" onClick={() => setOpenId(open ? null : event.id)} aria-expanded={open} aria-controls={`event-${event.id}`} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#fff8ec] sm:gap-4">
          <img src={event.image} alt="" className="hidden h-11 w-11 shrink-0 rounded-lg object-cover sm:block" />
          <span className="w-28 shrink-0 text-xs font-semibold leading-4 text-[#10261e]/55 sm:w-40 sm:text-sm">{formatEventDate(event)}</span>
          <span className={`min-w-0 flex-1 truncate font-semibold ${title ? "" : "italic text-[#a52520]"}`}>{title || "Ohne Titel"}</span>
          {hasErrors && <AlertCircle size={17} className="shrink-0 text-[#a52520]" aria-label="Fehler im Event" />}
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[status]}`}>{status}</span>
          <ChevronDown size={17} className={`shrink-0 text-[#10261e]/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div id={`event-${event.id}`} className="grid gap-4 border-t border-[#10261e]/10 p-4 sm:grid-cols-2 sm:p-5">
            <Field label={`Titel · ${language.toUpperCase()}`} error={errors.title} className="sm:col-span-2">
              <input value={event.title[language]} required aria-invalid={Boolean(errors.title)} placeholder={language === "en" ? event.title.de : "z. B. Noche de Mezcal"} onChange={(e) => edit(index, (item) => { item.title[language] = e.target.value; })} className={inputClass(errors.title)} />
            </Field>
            <Field label="Datum" error={errors.date}>
              <input type="date" value={event.date} onChange={(e) => edit(index, (item) => { item.date = e.target.value; })} className={inputClass(errors.date)} />
            </Field>
            <Field label="Uhrzeit" error={errors.time}>
              <input type="time" value={event.time} onChange={(e) => edit(index, (item) => { item.time = e.target.value; })} className={inputClass(errors.time)} />
            </Field>
            <Field label={`Beschreibung · ${language.toUpperCase()}`} error={errors.summary} className="sm:col-span-2">
              <textarea rows={3} value={event.summary[language]} placeholder={language === "en" ? event.summary.de : ""} onChange={(e) => edit(index, (item) => { item.summary[language] = e.target.value; })} className={`${inputClass(errors.summary)} py-2`} />
            </Field>
            <Field label={`Kurztext für die Startseite · ${language.toUpperCase()}`} hint="leer = automatisch aus der Beschreibung" className="sm:col-span-2" counter={`${(event.teaser?.[language] ?? "").length}/140`}>
              <input value={event.teaser?.[language] ?? ""} maxLength={140} onChange={(e) => edit(index, (item) => { item.teaser = { de: item.teaser?.de ?? "", en: item.teaser?.en ?? "", [language]: e.target.value }; })} className={inputClass()} />
            </Field>
            <div className="flex items-center gap-3 sm:col-span-2">
              <img src={event.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[#10261e]/20 px-4 text-sm font-semibold hover:bg-[#f4f0e8]">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}Eventbild ersetzen
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(index, file); e.target.value = ""; }} />
              </label>
              <span className="hidden text-xs text-[#10261e]/50 sm:inline">JPG, PNG oder WebP</span>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={event.published} onChange={(e) => edit(index, (item) => { item.published = e.target.checked; })} className="h-5 w-5" />Auf der Website veröffentlichen</label>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={event.showOnHome !== false} onChange={(e) => edit(index, (item) => { item.showOnHome = e.target.checked; })} className="h-5 w-5" />Auf der Startseite im Karussell zeigen</label>
            </div>
            <details className="rounded-xl bg-[#f4f0e8] px-4 py-3 text-sm sm:col-span-2">
              <summary className="cursor-pointer font-semibold">Erweitert</summary>
              <p className="mt-2">Interne ID: <code className="rounded bg-white px-1.5 py-0.5">{event.id}</code></p>
              <p className="mt-1 text-[#10261e]/60">{savedIds.has(event.id) ? "Die ID bleibt fest, weil geteilte Links darauf zeigen." : "Wird aus Titel und Jahr erzeugt und steht nach dem ersten Veröffentlichen fest."}</p>
            </details>
            <div className="sm:col-span-2">
              <button type="button" onClick={() => setRemove(index)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#a52520] hover:bg-red-50"><Trash2 size={16} />Event löschen</button>
            </div>
          </div>
        )}
      </li>
    );
  };

  const toRemove = remove !== null ? content.events[remove] : null;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#10261e]/55">Nur Events mit Status „Live“ erscheinen auf der Website. Sortiert nach Datum.</p>
        <button type="button" onClick={addEvent} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#10261e] px-4 text-sm font-semibold text-white"><Plus size={17} />Event</button>
      </div>
      {upcoming.length ? <ul className="space-y-2">{upcoming.map(row)}</ul> : <p className="rounded-2xl bg-white p-6 text-center text-sm text-[#10261e]/55">Keine kommenden Events.</p>}
      {archive.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-[#10261e]/70">Archiv · {archive.length} vergangene {archive.length === 1 ? "Event" : "Events"}</summary>
          <ul className="mt-3 space-y-2">{archive.map(row)}</ul>
        </details>
      )}
      <AdminConfirmDialog open={toRemove !== null} title={`„${toRemove?.title.de || "Event ohne Titel"}“ löschen?`} confirmLabel="Event löschen" danger onConfirm={() => { if (remove !== null) change((copy) => { copy.events.splice(remove, 1); }); setRemove(null); }} onCancel={() => setRemove(null)}>
        <p>Das Event verschwindet nach dem Veröffentlichen von der Website. Bis dahin können Sie es mit „Verwerfen“ zurückholen.</p>
      </AdminConfirmDialog>
    </div>
  );
}

const inputClass = (error?: string) => `min-h-11 w-full rounded-xl border px-3 text-base ${error ? "border-[#a52520] bg-red-50/40" : ""}`;

function Field({ label, error, hint, counter, className = "", children }: { label: string; error?: string; hint?: string; counter?: string; className?: string; children: React.ReactNode }) {
  const over = counter ? Number(counter.split("/")[0]) >= Number(counter.split("/")[1]) : false;
  return (
    <label className={`grid gap-1 text-sm ${className}`}>
      <span className="flex items-baseline justify-between gap-3">
        <span>{label}{hint && <span className="ml-2 text-xs opacity-50">{hint}</span>}</span>
        {counter && <span className={`text-xs tabular-nums ${over ? "font-semibold text-[#a52520]" : "text-[#10261e]/45"}`}>{counter}</span>}
      </span>
      {children}
      {error && <span role="alert" className="text-xs font-semibold text-[#a52520]">{error}</span>}
    </label>
  );
}
