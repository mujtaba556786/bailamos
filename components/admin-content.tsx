"use client";
// "Website-Inhalte": sub-tabs for each part of the public site and one sticky save bar.
// Everything lives in one content document, so "Veröffentlichen" always publishes all sub-tabs together.
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Eye, Languages, Loader2, RotateCcw, Send } from "lucide-react";
import type { MarketingContent } from "../lib/marketing-content";
import { type PickerCategory, type PickerDish, CONTENT_SECTIONS, changeSummary, contentChanges, missingEnglish, publishBlockers, sectionFromSearch, totalChanges, type ContentSection } from "../lib/content-admin";
import { AdminConfirmDialog } from "./admin-confirm-dialog";
import { AdminOpening } from "./admin-opening";
import { CONTENT_PUBLISHED, SITE_LOCK_CHANGED, type SiteLockResult } from "./admin-site-status";
import { openingActive } from "../lib/opening";
import { EventsSection } from "./admin-content/events";
import { HomeSection } from "./admin-content/home";
import { MediaSection } from "./admin-content/media";
import { SocialSection } from "./admin-content/social";


export function AdminContent({ adminKey, onDirtyChange }: { adminKey: string; onDirtyChange?: (dirty: boolean) => void }) {
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [saved, setSaved] = useState<MarketingContent | null>(null);
  const [version, setVersion] = useState(0);
  const [section, setSection] = useState<ContentSection>("startseite");
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<"discard" | "preview" | "publish" | null>(null);
  const [menuDishes, setMenuDishes] = useState<PickerDish[]>([]);
  const [menuCategories, setMenuCategories] = useState<PickerCategory[]>([]);

  const savedRef = useRef<MarketingContent | null>(null);
  savedRef.current = saved;

  // The banner locked or released the site: take over the new lock state and version,
  // without touching other unpublished edits.
  useEffect(() => {
    const onLock = (event: Event) => {
      const result = (event as CustomEvent<SiteLockResult>).detail;
      const before = savedRef.current?.opening.enabled;
      setSaved((current) => current && { ...current, opening: { ...current.opening, enabled: result.enabled } });
      setContent((current) => current && current.opening.enabled === before ? { ...current, opening: { ...current.opening, enabled: result.enabled } } : current);
      setVersion((current) => (result.previousVersion === current ? result.version : current));
    };
    window.addEventListener(SITE_LOCK_CHANGED, onLock);
    return () => window.removeEventListener(SITE_LOCK_CHANGED, onLock);
  }, []);

  const changes = useMemo(() => contentChanges(saved, content), [saved, content]);
  const total = totalChanges(changes);
  const missing = useMemo(() => (content ? missingEnglish(content) : null), [content]);
  const summary = useMemo(() => changeSummary(saved, content), [saved, content]);
  const blockers = useMemo(() => (content ? publishBlockers(content) : []), [content]);
  const savedIds = useMemo(() => new Set(saved?.events.map((event) => event.id) ?? []), [saved]);

  async function request(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, { ...options, headers: { ...options.headers, "x-admin-key": adminKey } });
    const result = (await response.json()) as any;
    if (!response.ok) throw new Error(result.error || "Änderung fehlgeschlagen.");
    return result;
  }

  async function load() {
    setLoading(true); setError("");
    try {
      const result = await request("/api/admin/content");
      setContent(result.content); setSaved(result.content); setVersion(result.version);
      setAiConfigured(result.aiConfigured === true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Inhalte konnten nicht geladen werden.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    setSection(sectionFromSearch(window.location.search));
    void load();
    void (async () => {
      try {
        const response = await fetch("/api/admin/menu", { headers: { "x-admin-key": adminKey } });
        const result = (await response.json()) as { content?: { dishes?: PickerDish[]; categories?: PickerCategory[] } };
        if (response.ok) { setMenuDishes(result.content?.dishes ?? []); setMenuCategories(result.content?.categories ?? []); }
      } catch { /* the dish picker stays empty */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tell the admin page about unsaved changes (for switching admin tabs) and warn before closing the page.
  useEffect(() => {
    onDirtyChange?.(total > 0);
    if (total === 0) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [total, onDirtyChange]);

  // A success message disappears after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function openSection(id: ContentSection) {
    setSection(id);
    const url = new URL(window.location.href);
    url.searchParams.set("section", id);
    window.history.replaceState(null, "", url);
  }

  function change(mutator: (copy: MarketingContent) => void) {
    setContent((current) => {
      if (!current) return current;
      const copy = structuredClone(current);
      mutator(copy);
      return copy;
    });
    setNotice("");
  }

  async function uploadMedia(file: File, expect?: "image") {
    setUploading(true); setError("");
    try {
      const result = await request("/api/admin/media", { method: "POST", headers: { "content-type": file.type }, body: file });
      if (expect === "image" && result.kind !== "image") throw new Error("Bitte ein Bild (JPG, PNG oder WebP) wählen.");
      setNotice("Datei hochgeladen. Zum Übernehmen auf die Website bitte veröffentlichen.");
      return { url: result.url as string, kind: result.kind as "image" | "video" };
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload fehlgeschlagen.");
      return null;
    } finally { setUploading(false); }
  }

  async function publish() {
    if (!content) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await request("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content, version }) });
      setContent(result.content); setSaved(result.content); setVersion(result.version);
      setDialog(null);
      setNotice("Alle Bereiche wurden veröffentlicht.");
      window.dispatchEvent(new Event(CONTENT_PUBLISHED));
    } catch (cause) {
      setDialog(null);
      setError(cause instanceof Error ? cause.message : "Änderungen konnten nicht gespeichert werden.");
    } finally { setSaving(false); }
  }

  function discard() {
    setContent(saved); setDialog(null); setError("");
    setNotice("Ungespeicherte Änderungen verworfen.");
  }

  async function generateEnglish() {
    if (!content) return;
    setTranslating(true); setError("");
    try {
      const texts = [...content.events.flatMap((x) => [x.title.de, x.summary.de]), ...content.demoMedia.gallery.map((x) => x.label.de), ...content.demoMedia.videos.map((x) => x.title.de)];
      const result = await request("/api/admin/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts }) });
      let cursor = 0;
      change((copy) => {
        for (const event of copy.events) { event.title.en = result.translations[cursor++]; event.summary.en = result.translations[cursor++]; }
        for (const item of copy.demoMedia.gallery) item.label.en = result.translations[cursor++];
        for (const item of copy.demoMedia.videos) item.title.en = result.translations[cursor++];
      });
      setLanguage("en");
      setNotice("Englischer Entwurf erstellt. Bitte prüfen und veröffentlichen.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Übersetzung fehlgeschlagen.");
    } finally { setTranslating(false); }
  }

  if (loading) return <div className="grid min-h-[480px] place-items-center"><Loader2 className="animate-spin text-[#b8782e]" size={32} /></div>;
  if (!content) return <div className="mx-auto max-w-xl p-10 text-center"><p>{error || "Keine Inhalte verfügbar."}</p><button onClick={load} className="mt-4 text-[#a52520] underline">Erneut versuchen</button></div>;

  const props = { content, language, change, uploading, uploadMedia };
  const current = CONTENT_SECTIONS.find((item) => item.id === section)!;
  const missingHere = missing?.[section] ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-8 lg:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Website verwalten</p>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl">Website-Inhalte</h1>
          <p className="mt-2 text-base text-[#10261e]/55">Alle Bereiche werden gemeinsam in beiden Sprachen veröffentlicht.</p>
        </div>
      </div>

      <div role="tablist" aria-label="Bereiche der Website" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {CONTENT_SECTIONS.map((item, index) => {
          const active = item.id === section;
          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="content-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => openSection(item.id)}
              onKeyDown={(event) => {
                const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                if (!step) return;
                event.preventDefault();
                const next = CONTENT_SECTIONS[(index + step + CONTENT_SECTIONS.length) % CONTENT_SECTIONS.length];
                openSection(next.id);
                document.getElementById(`tab-${next.id}`)?.focus();
              }}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${active ? "bg-[#10261e] text-white" : "bg-white text-[#10261e]/70 hover:text-[#10261e]"}`}
            >
              {item.label}
              {changes[item.id] > 0 && <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-[#c68a3b]/20 text-[#8a5a1c]"}`} title="Ungespeicherte Änderungen">{changes[item.id]}</span>}
              {(missing?.[item.id].length ?? 0) > 0 && <span className={`text-[10px] font-bold ${active ? "text-[#f4c878]" : "text-[#a52520]"}`} title="Englische Texte fehlen">EN</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">{current.label}</h2>
        <a href={current.view} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#a52520] hover:bg-white">
          Ansehen <ExternalLink size={15} />
        </a>
      </div>
      {missingHere.length > 0 && (
        <details className="mt-2 rounded-xl bg-[#a52520]/5 px-4 py-3 text-sm text-[#7d1d19]">
          <summary className="cursor-pointer font-semibold">Englisch fehlt bei {missingHere.length} {missingHere.length === 1 ? "Feld" : "Feldern"}</summary>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">{missingHere.map((label) => <li key={label}>{label}</li>)}</ul>
        </details>
      )}

      <div id="content-panel" role="tabpanel" aria-labelledby={`tab-${section}`} className="mt-5 pb-8">
        {section === "startseite" && <HomeSection {...props} menuDishes={menuDishes} menuCategories={menuCategories} />}
        {section === "events" && <EventsSection {...props} savedIds={savedIds} />}
        {section === "medien" && <MediaSection {...props} />}
        {section === "social" && <SocialSection {...props} />}
        {section === "eroeffnung" && <AdminOpening value={content.opening} saved={saved?.opening ?? null} onChange={(opening) => change((copy) => { copy.opening = opening; })} adminKey={adminKey} language={language} />}
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 border-t border-[#10261e]/10 bg-[#f4f0e8]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        {(error || notice) && (
          <p role={error ? "alert" : "status"} className={`mb-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
            {!error && <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}{error || notice}
          </p>
        )}
        {blockers.length > 0 && (
          <div role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Vor dem Veröffentlichen bitte beheben:</strong>
            <ul className="mt-1 list-disc pl-5">
              {blockers.map((item) => (
                <li key={item.text}>
                  {item.text}
                  {item.section !== section && <button type="button" onClick={() => openSection(item.section)} className="ml-2 font-semibold underline underline-offset-2">Zu „{CONTENT_SECTIONS.find((entry) => entry.id === item.section)?.label}“</button>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <p className="mr-auto min-w-0 text-sm" aria-live="polite">
            {total > 0
              ? <><strong className="text-[#8a5a1c]">{total} ungespeicherte {total === 1 ? "Änderung" : "Änderungen"}</strong><span className="hidden text-[#10261e]/55 md:inline"> · Veröffentlichen übernimmt alle Bereiche</span></>
              : <span className="text-[#10261e]/55">Alles veröffentlicht</span>}
          </p>
          <div className="flex rounded-full border border-[#10261e]/15 bg-white p-0.5" role="group" aria-label="Sprache bearbeiten">
            {(["de", "en"] as const).map((code) => (
              <button key={code} type="button" onClick={() => setLanguage(code)} aria-pressed={language === code} className={`min-h-9 rounded-full px-3 text-sm font-semibold ${language === code ? "bg-[#10261e] text-white" : "text-[#10261e]/70"}`}>{code.toUpperCase()}</button>
            ))}
          </div>
          <span title={aiConfigured ? "Englische Texte automatisch erstellen" : "Automatische Übersetzung nicht verfügbar"}>
            <button type="button" disabled={translating || !aiConfigured} onClick={generateEnglish} aria-label="Englisch generieren" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#10261e]/15 bg-white px-3 text-sm font-semibold disabled:opacity-45">
              {translating ? <Loader2 className="animate-spin" size={16} /> : <Languages size={16} />}<span className="hidden lg:inline">Englisch generieren</span>
            </button>
          </span>
          <button type="button" disabled={total === 0 || saving} onClick={() => setDialog("discard")} aria-label="Verwerfen" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#10261e]/15 bg-white px-3 text-sm font-semibold disabled:opacity-40">
            <RotateCcw size={16} /><span className="hidden sm:inline">Verwerfen</span>
          </button>
          <button type="button" disabled={total === 0 || saving} onClick={() => setDialog("preview")} aria-label="Vorschau" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#10261e]/15 bg-white px-3 text-sm font-semibold disabled:opacity-40">
            <Eye size={16} /><span className="hidden sm:inline">Vorschau</span>
          </button>
          <button type="button" disabled={total === 0 || saving || blockers.length > 0} onClick={() => setDialog("publish")} title={blockers.length ? "Bitte zuerst die markierten Fehler beheben" : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#a52520] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#bf3029] disabled:opacity-40 disabled:shadow-none">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}Veröffentlichen
          </button>
        </div>
      </div>

      <AdminConfirmDialog open={dialog === "discard"} title="Änderungen verwerfen?" confirmLabel="Verwerfen" danger onConfirm={discard} onCancel={() => setDialog(null)}>
        <p>{total} ungespeicherte {total === 1 ? "Änderung geht" : "Änderungen gehen"} in allen Bereichen verloren. Die Website bleibt unverändert.</p>
      </AdminConfirmDialog>
      <AdminConfirmDialog open={dialog === "preview" || dialog === "publish"} title={dialog === "preview" ? "Vorschau der Änderungen" : "Diese Änderungen veröffentlichen?"} confirmLabel="Jetzt veröffentlichen" confirmDisabled={blockers.length > 0} cancelLabel={dialog === "preview" ? "Schließen" : "Abbrechen"} busy={saving} onConfirm={publish} onCancel={() => setDialog(null)}>
        <p>Veröffentlicht werden alle Bereiche gemeinsam, auf Deutsch und Englisch:</p>
        <ul className="mt-2 space-y-1">
          {summary.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 rounded-lg bg-[#f4f0e8] px-3 py-2 text-[#10261e]">
              <span>{item.label}{dialog === "preview" && <a href={CONTENT_SECTIONS.find((entry) => entry.id === item.id)?.view} target="_blank" rel="noreferrer" className="ml-2 text-xs font-semibold text-[#a52520] underline underline-offset-2">aktuell live ansehen ↗</a>}</span><strong className="shrink-0">{item.count} {item.count === 1 ? "Änderung" : "Änderungen"}</strong>
            </li>
          ))}
        </ul>
        {summary.some((item) => (missing?.[item.id].length ?? 0) > 0) && <p className="mt-3 text-[#a52520]">Hinweis: Bei einigen Texten fehlt noch die englische Fassung. Dort wird der deutsche Text gezeigt.</p>}
        {saved && openingActive(content.opening) !== openingActive(saved.opening) && <p className="mt-3 font-semibold text-[#a52520]">Achtung: Diese Veröffentlichung {openingActive(content.opening) ? "sperrt die Website für Gäste" : "gibt die Website für Gäste frei"}.</p>}
      </AdminConfirmDialog>
    </div>
  );
}
