"use client";
// Sub-tab "Galerie & Videos": one drop zone and one grid for images and videos.
// Reorder by dragging or with the ← → buttons (keyboard), delete with confirmation.
import { useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, GripVertical, Loader2, Trash2, UploadCloud } from "lucide-react";
import { moveItem } from "../../lib/menu-admin";
import { titleWarning } from "../../lib/content-admin";
import { AdminConfirmDialog } from "../admin-confirm-dialog";
import type { SectionProps } from "./types";

type Kind = "gallery" | "videos";
const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm";
const MAX_BYTES = 50 * 1024 * 1024;

export function MediaSection({ content, language, change, uploading, uploadMedia }: SectionProps) {
  const [over, setOver] = useState(false);
  const [drag, setDrag] = useState<{ kind: Kind; index: number } | null>(null);
  const [target, setTarget] = useState<{ kind: Kind; index: number } | null>(null);
  const [remove, setRemove] = useState<{ kind: Kind; index: number } | null>(null);
  const [problem, setProblem] = useState("");
  const [progress, setProgress] = useState("");

  // Checks type and size before uploading; the server checks again.
  async function uploadFiles(files: File[]) {
    setProblem("");
    const allowed = ACCEPT.split(",");
    const bad = files.filter((file) => !allowed.includes(file.type) || file.size > MAX_BYTES);
    if (bad.length) setProblem(`${bad.map((file) => file.name).join(", ")}: nur JPG, PNG, WebP, MP4 oder WebM bis 50 MB.`);
    const good = files.filter((file) => !bad.includes(file));
    for (const [position, file] of good.entries()) {
      setProgress(good.length > 1 ? `${position + 1} von ${good.length}` : "");
      const result = await uploadMedia(file);
      if (!result) continue;
      const name = file.name.replace(/\.[^.]+$/, "") || "Video";
      // Images start without a title on purpose: the title becomes the alt text, so it must be written by a person.
      if (result.kind === "image") change((copy) => { copy.demoMedia.gallery.push({ label: { de: "", en: "" }, source: "Bailamos", url: result.url, image: result.url }); });
      else change((copy) => { copy.demoMedia.videos.push({ title: { de: name, en: name }, source: "Bailamos", url: result.url, poster: "/table-terrace.webp" }); });
    }
    setProgress("");
  }

  function move(kind: Kind, from: number, to: number) {
    change((copy) => {
      if (kind === "gallery") copy.demoMedia.gallery = moveItem(copy.demoMedia.gallery, from, to);
      else copy.demoMedia.videos = moveItem(copy.demoMedia.videos, from, to);
    });
  }

  function card(kind: Kind, index: number) {
    const image = kind === "gallery" ? content.demoMedia.gallery[index] : null;
    const video = kind === "videos" ? content.demoMedia.videos[index] : null;
    const title = image ? image.label : video!.title;
    const warning = image ? titleWarning(image.label) : title.de.trim() ? "" : "Titel fehlt";
    const count = kind === "gallery" ? content.demoMedia.gallery.length : content.demoMedia.videos.length;
    const noun = kind === "gallery" ? "Bild" : "Video";
    const isTarget = target?.kind === kind && target.index === index && drag?.index !== index;
    return (
      <li
        key={`${kind}-${index}-${image?.image ?? video?.url}`}
        draggable
        onDragStart={(event) => { setDrag({ kind, index }); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", `${kind}:${index}`); }}
        onDragOver={(event) => { if (drag?.kind !== kind) return; event.preventDefault(); setTarget({ kind, index }); }}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (drag?.kind === kind) move(kind, drag.index, index); setDrag(null); setTarget(null); }}
        onDragEnd={() => { setDrag(null); setTarget(null); }}
        className={`overflow-hidden rounded-2xl bg-white shadow-sm transition ${drag?.kind === kind && drag.index === index ? "opacity-40" : ""} ${isTarget ? "ring-2 ring-[#c68a3b]" : ""}`}
      >
        <div className="relative aspect-[4/3] bg-[#10261e]/5">
          {image ? <img src={image.image} alt={image.label.de || ""} className="h-full w-full object-cover" /> : <video src={`${video!.url}#t=0.5`} preload="metadata" muted playsInline className="h-full w-full object-cover" />}
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">{noun} {index + 1}</span>
          {warning && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#a52520] px-2 py-0.5 text-[11px] font-semibold text-white"><AlertTriangle size={12} />{warning}</span>}
          <span className="absolute bottom-2 left-2 hidden cursor-grab rounded-full bg-white/90 p-1 text-[#10261e]/60 sm:block" title="Ziehen zum Sortieren" aria-hidden="true"><GripVertical size={16} /></span>
        </div>
        <div className="grid gap-2 p-3">
          <label className="grid min-w-0 gap-1 text-xs text-[#10261e]/60">
            {image ? "Bildtitel" : "Videotitel"} · {language.toUpperCase()}
            <input
              value={title[language]}
              placeholder={language === "en" ? title.de : image ? "z. B. Terrasse am Abend" : ""}
              onChange={(event) => change((copy) => {
                const item = kind === "gallery" ? copy.demoMedia.gallery[index].label : copy.demoMedia.videos[index].title;
                item[language] = event.target.value;
              })}
              className={`min-h-10 w-full min-w-0 rounded-lg border px-2 text-sm text-[#10261e] ${warning === "Titel fehlt" && language === "de" ? "border-[#a52520]" : ""}`}
            />
          </label>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={`${noun} ${index + 1} nach vorne`} disabled={index === 0} onClick={() => move(kind, index, index - 1)} className="grid h-10 w-10 place-items-center rounded-full text-[#10261e]/60 hover:bg-[#f4f0e8] disabled:opacity-30"><ArrowLeft size={16} /></button>
            <button type="button" aria-label={`${noun} ${index + 1} nach hinten`} disabled={index === count - 1} onClick={() => move(kind, index, index + 1)} className="grid h-10 w-10 place-items-center rounded-full text-[#10261e]/60 hover:bg-[#f4f0e8] disabled:opacity-30"><ArrowRight size={16} /></button>
            <button type="button" aria-label={`${noun} ${index + 1} löschen`} onClick={() => setRemove({ kind, index })} className="ml-auto grid h-10 w-10 place-items-center rounded-full text-[#a52520] hover:bg-red-50"><Trash2 size={16} /></button>
          </div>
        </div>
      </li>
    );
  }

  const removing = remove ? (remove.kind === "gallery" ? content.demoMedia.gallery[remove.index]?.label.de : content.demoMedia.videos[remove.index]?.title.de) : "";
  return (
    <div className="space-y-6">
      <label
        onDragOver={(event) => { if (drag) return; event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { if (drag) return; event.preventDefault(); setOver(false); void uploadFiles(Array.from(event.dataTransfer.files)); }}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed p-6 text-center transition ${over ? "border-[#c68a3b] bg-[#fff8ec]" : "border-[#10261e]/20 bg-white"}`}
      >
        {uploading ? <Loader2 className="animate-spin text-[#a52520]" /> : <UploadCloud className="text-[#a52520]" />}
        <strong>{uploading ? `Wird hochgeladen… ${progress}` : "Bilder oder Videos hierher ziehen oder auswählen"}</strong>
        <span className="text-sm text-[#10261e]/55">JPG, PNG, WebP, MP4 oder WebM · bis 50 MB · mehrere Dateien möglich</span>
        <input type="file" multiple accept={ACCEPT} disabled={uploading} className="sr-only" onChange={(event) => { void uploadFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      </label>
      {problem && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{problem}</p>}

      <section aria-label="Bilder">
        <h3 className="text-sm font-semibold uppercase tracking-[.14em] text-[#10261e]/55">Bilder · {content.demoMedia.gallery.length}</h3>
        <p className="mb-3 mt-1 text-sm text-[#10261e]/55">Der Bildtitel ist auch die Bildbeschreibung für Google und Screenreader. Bitte kurz beschreiben, was zu sehen ist.</p>
        {content.demoMedia.gallery.length ? <ol className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{content.demoMedia.gallery.map((_, index) => card("gallery", index))}</ol> : <p className="rounded-2xl bg-white p-6 text-center text-sm text-[#10261e]/55">Noch keine Bilder.</p>}
      </section>
      <section aria-label="Videos">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[.14em] text-[#10261e]/55">Videos · {content.demoMedia.videos.length}</h3>
        {content.demoMedia.videos.length ? <ol className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{content.demoMedia.videos.map((_, index) => card("videos", index))}</ol> : <p className="rounded-2xl bg-white p-6 text-center text-sm text-[#10261e]/55">Noch keine Videos.</p>}
      </section>

      <AdminConfirmDialog open={remove !== null} title={`${remove?.kind === "videos" ? "Video" : "Bild"} löschen?`} confirmLabel="Löschen" danger onConfirm={() => {
        if (remove) change((copy) => { if (remove.kind === "gallery") copy.demoMedia.gallery.splice(remove.index, 1); else copy.demoMedia.videos.splice(remove.index, 1); });
        setRemove(null);
      }} onCancel={() => setRemove(null)}>
        <p>„{removing || "Ohne Titel"}“ verschwindet nach dem Veröffentlichen von der Website. Bis dahin können Sie es mit „Verwerfen“ zurückholen.</p>
      </AdminConfirmDialog>
    </div>
  );
}
