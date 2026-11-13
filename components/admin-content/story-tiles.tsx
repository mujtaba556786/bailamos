"use client";
// "Startseite · Fotokacheln": the photo tiles under "Wärme, die man sieht".
// Click the photo to replace it, add tiles (up to 6), reorder with the arrows, delete with confirmation.
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "../admin-confirm-dialog";
import { moveItem } from "../../lib/menu-admin";
import type { SectionProps } from "./types";

export const MAX_STORY_TILES = 6;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function StoryTiles({ content, language, change, uploading, uploadMedia }: SectionProps) {
  const [busy, setBusy] = useState<number | "new" | null>(null);
  const [remove, setRemove] = useState<number | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const newInput = useRef<HTMLInputElement | null>(null);
  const tiles = content.storyTiles;
  const full = tiles.length >= MAX_STORY_TILES;

  async function replace(index: number, file: File) {
    setBusy(index);
    const result = await uploadMedia(file, "image");
    setBusy(null);
    if (result) change((copy) => { copy.storyTiles[index].image = result.url; });
  }

  // A new tile starts with the uploaded photo, so it never shows an empty frame on the website.
  async function add(file: File) {
    setBusy("new");
    const result = await uploadMedia(file, "image");
    setBusy(null);
    if (result) change((copy) => { copy.storyTiles.push({ id: `kachel-${Date.now()}`, image: result.url, title: { de: "", en: "" }, text: { de: "", en: "" }, show: true }); });
  }

  const toRemove = remove !== null ? tiles[remove] : null;
  return (
    <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Startseite · Fotokacheln</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#10261e]/55">Die Bildkacheln im Abschnitt „Wärme, die man sieht“. Die ersten zwei stehen nebeneinander, die weiteren darunter. Zum Ersetzen auf das Foto klicken.</p>
        </div>
        <button type="button" disabled={full || uploading} onClick={() => newInput.current?.click()} title={full ? `Höchstens ${MAX_STORY_TILES} Kacheln` : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#10261e] px-4 text-sm font-semibold text-white disabled:opacity-40">
          {busy === "new" ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}Kachel hinzufügen
        </button>
        <input ref={newInput} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} onChange={(event) => { const file = event.target.files?.[0]; if (file) void add(file); event.target.value = ""; }} />
      </div>
      {full && <p className="mt-2 text-xs text-[#10261e]/50">Höchstens {MAX_STORY_TILES} Kacheln. Zum Hinzufügen bitte erst eine löschen.</p>}

      {tiles.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-[#f4f0e8] p-6 text-center text-sm text-[#10261e]/60">Keine Fotokacheln. Der Abschnitt wird auf der Startseite ausgeblendet.</p>
      ) : (
        <ol className="mt-6 grid gap-4">
          {tiles.map((tile, index) => (
            <li key={tile.id} className={`grid gap-4 rounded-2xl border border-[#10261e]/10 p-4 sm:grid-cols-[200px_1fr] ${tile.show ? "" : "bg-[#f4f0e8]/60"}`}>
              <button
                type="button"
                onClick={() => inputs.current[index]?.click()}
                disabled={uploading}
                aria-label={`Foto von Kachel ${index + 1} ersetzen`}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#10261e]/5"
              >
                {tile.image && <img src={tile.image} alt="" className={`h-full w-full object-cover ${tile.show ? "" : "opacity-50 grayscale"}`} />}
                <span className={`absolute inset-0 grid place-items-center bg-[#10261e]/55 text-sm font-semibold text-white transition ${busy === index ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                  {busy === index ? <Loader2 className="animate-spin" /> : <span className="inline-flex items-center gap-2"><ImagePlus size={18} />Foto ersetzen</span>}
                </span>
              </button>
              <input ref={(element) => { inputs.current[index] = element; }} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} onChange={(event) => { const file = event.target.files?.[0]; if (file) void replace(index, file); event.target.value = ""; }} />
              <div className="grid content-start gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <strong className="mr-1">Kachel {index + 1}</strong>
                  <label className="flex min-h-10 items-center gap-2 rounded-full px-2"><input type="checkbox" checked={tile.show} onChange={(event) => change((copy) => { copy.storyTiles[index].show = event.target.checked; })} className="h-5 w-5" />Anzeigen</label>
                  {!tile.show && <span className="rounded-full bg-[#10261e]/8 px-2 py-0.5 text-xs font-semibold text-[#10261e]/55">ausgeblendet</span>}
                  <span className="ml-auto flex items-center gap-1">
                    <button type="button" aria-label={`Kachel ${index + 1} nach oben`} disabled={index === 0} onClick={() => change((copy) => { copy.storyTiles = moveItem(copy.storyTiles, index, index - 1); })} className="grid h-10 w-10 place-items-center rounded-full text-[#10261e]/60 hover:bg-[#f4f0e8] disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button type="button" aria-label={`Kachel ${index + 1} nach unten`} disabled={index === tiles.length - 1} onClick={() => change((copy) => { copy.storyTiles = moveItem(copy.storyTiles, index, index + 1); })} className="grid h-10 w-10 place-items-center rounded-full text-[#10261e]/60 hover:bg-[#f4f0e8] disabled:opacity-30"><ArrowDown size={16} /></button>
                    <button type="button" aria-label={`Kachel ${index + 1} löschen`} onClick={() => setRemove(index)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#a52520] hover:bg-red-50"><Trash2 size={16} /><span className="hidden sm:inline">Löschen</span></button>
                  </span>
                </div>
                <label className="grid gap-1 text-sm">Titel · {language.toUpperCase()}<input value={tile.title[language]} maxLength={80} placeholder={language === "en" ? tile.title.de : "z. B. Abends draußen."} onChange={(event) => change((copy) => { copy.storyTiles[index].title[language] = event.target.value; })} className="min-h-11 rounded-xl border px-3 text-base" /></label>
                <label className="grid gap-1 text-sm">Kurztext (optional) · {language.toUpperCase()}<input value={tile.text[language]} maxLength={160} onChange={(event) => change((copy) => { copy.storyTiles[index].text[language] = event.target.value; })} className="min-h-11 rounded-xl border px-3 text-base" /></label>
              </div>
            </li>
          ))}
        </ol>
      )}

      <AdminConfirmDialog open={toRemove !== null} title={`Kachel ${remove !== null ? remove + 1 : ""} löschen?`} confirmLabel="Kachel löschen" danger onConfirm={() => { if (remove !== null) change((copy) => { copy.storyTiles.splice(remove, 1); }); setRemove(null); }} onCancel={() => setRemove(null)}>
        <p>„{toRemove?.title.de || "Ohne Titel"}“ verschwindet nach dem Veröffentlichen von der Startseite. Nur ausblenden geht mit „Anzeigen“. Bis zum Veröffentlichen holt „Verwerfen“ die Kachel zurück.</p>
      </AdminConfirmDialog>
    </section>
  );
}
