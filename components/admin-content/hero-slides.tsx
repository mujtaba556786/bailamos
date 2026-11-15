"use client";
// Sub-tab "Startseite-Karussell": the big slides at the top of the homepage.
// Own slides are managed here (order, on/off, dates, texts DE/EN, image). Event and dish slides stay automatic;
// the two switches turn them on or off. Everything is saved with "Veröffentlichen", like the other sub-tabs.
import { useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Copy, GripVertical, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "../admin-confirm-dialog";
import { berlinDate } from "../../lib/booking-policy";
import { heroTitleClass } from "../../lib/hero-title";
import { HERO_LIMITS, MAX_HERO_SLIDES, duplicateHeroSlide, heroSlideErrors, heroSlideId, heroSlideState, moveHeroSlide, newHeroSlide, type HeroSlide } from "../../lib/hero-slides";
import type { SectionProps } from "./types";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const STATE_TONES = { live: "bg-[#D1FAE5] text-[#065F46]", planned: "bg-[#DBEAFE] text-[#1E40AF]", expired: "bg-[#E5E7EB] text-[#374151]", off: "bg-[#FEF3C7] text-[#92400E]" } as const;
type Lang = "de" | "en";
type TextField = "badge" | "headline" | "subline" | "ctaLabel" | "alt";

export function HeroSlidesSection({ content, language, change, uploading, uploadMedia }: SectionProps) {
  const carousel = content.heroCarousel, slides = carousel.slides, today = berlinDate();
  const [editing, setEditing] = useState<string | null>(null);
  const [remove, setRemove] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const full = slides.length >= MAX_HERO_SLIDES;

  const update = (index: number, mutate: (slide: HeroSlide) => void) => change((copy) => { mutate(copy.heroCarousel.slides[index]); });
  const move = (from: number, to: number) => change((copy) => { copy.heroCarousel.slides = moveHeroSlide(copy.heroCarousel.slides, from, to); });

  function add() {
    const id = heroSlideId(slides.map((slide) => slide.id));
    change((copy) => { copy.heroCarousel.slides.push(newHeroSlide(id, copy.heroCarousel.slides.length)); });
    setEditing(id);
  }
  function duplicate(index: number) {
    const id = heroSlideId(slides.map((slide) => slide.id));
    change((copy) => { copy.heroCarousel.slides = duplicateHeroSlide(copy.heroCarousel.slides, index, id); });
    setEditing(id);
  }

  const toRemove = remove !== null ? slides[remove] : null;
  return (
    <>
      <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Startseite · Karussell</h2>
            <p className="mt-1 max-w-3xl text-sm text-[#10261e]/55">Die großen Bilder ganz oben auf der Startseite. Eigene Folien erscheinen zuerst, in dieser Reihenfolge. Mit „Ab“ und „Bis“ erscheinen saisonale Folien (z. B. Weihnachten) automatisch und verschwinden wieder.</p>
          </div>
          <button type="button" disabled={full} onClick={add} title={full ? `Höchstens ${MAX_HERO_SLIDES} Folien` : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#10261e] px-4 text-sm font-semibold text-white disabled:opacity-40"><Plus size={17} />Folie hinzufügen</button>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl bg-[#f4f0e8] p-4 sm:grid-cols-2">
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={carousel.showEvents} onChange={(event) => change((copy) => { copy.heroCarousel.showEvents = event.target.checked; })} className="mt-0.5 h-5 w-5 shrink-0" /><span><strong>Events automatisch zeigen</strong><br /><span className="text-[#10261e]/60">Bis zu drei kommende Events mit „Startseite“-Haken (Tab „Events“). Nach dem Termin verschwinden sie von selbst.</span></span></label>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={carousel.showDishes} onChange={(event) => change((copy) => { copy.heroCarousel.showDishes = event.target.checked; })} className="mt-0.5 h-5 w-5 shrink-0" /><span><strong>Gerichte automatisch zeigen</strong><br /><span className="text-[#10261e]/60">Bis zu drei Gerichte, die in der Speisekarte als „Empfohlen“ markiert sind.</span></span></label>
        </div>

        {slides.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-[#f4f0e8] p-6 text-center text-sm text-[#10261e]/60">Keine eigenen Folien. Die Startseite zeigt dann nur Events und Gerichte – oder, wenn auch die fehlen, die Willkommens-Folie.</p>
        ) : (
          <ol className="mt-6 grid gap-3" aria-label="Eigene Folien">
            {slides.map((slide, index) => {
              const state = heroSlideState(slide, today), errors = heroSlideErrors(slide), open = editing === slide.id;
              const title = slide.headline.de.trim() || "Neue Folie";
              return (
                <li
                  key={slide.id}
                  onDragOver={(event) => { if (dragging === null) return; event.preventDefault(); setOver(index); }}
                  onDrop={(event) => { event.preventDefault(); if (dragging !== null) move(dragging, index); setDragging(null); setOver(null); }}
                  className={`rounded-2xl border p-3 transition sm:p-4 ${over === index && dragging !== null && dragging !== index ? "border-[#c68a3b] bg-[#fff8ec]" : "border-[#10261e]/10"} ${slide.active ? "" : "bg-[#f4f0e8]/60"}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      draggable
                      onDragStart={(event) => { setDragging(index); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", slide.id); }}
                      onDragEnd={() => { setDragging(null); setOver(null); }}
                      title="Ziehen zum Verschieben"
                      aria-hidden="true"
                      className="hidden cursor-grab text-[#10261e]/35 active:cursor-grabbing sm:block"
                    ><GripVertical size={20} /></span>
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-[#10261e]/10">
                      {slide.image && <img src={slide.image} alt="" className={`h-full w-full object-cover ${slide.active ? "" : "opacity-50 grayscale"}`} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{index + 1}. {title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${STATE_TONES[state.tone]}`}>{state.label}</span>
                        {Object.keys(errors).length > 0 && <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 font-semibold text-[#991B1B]">Unvollständig</span>}
                      </div>
                    </div>
                    <label className="flex min-h-11 items-center gap-2 rounded-full px-2 text-sm"><input type="checkbox" checked={slide.active} onChange={(event) => update(index, (draft) => { draft.active = event.target.checked; })} className="h-5 w-5" />Aktiv</label>
                    <span className="flex items-center gap-1">
                      <button type="button" aria-label={`Folie ${index + 1} nach oben`} disabled={index === 0} onClick={() => move(index, index - 1)} className="grid h-11 w-11 place-items-center rounded-full text-[#10261e]/60 hover:bg-[#f4f0e8] disabled:opacity-30"><ArrowUp size={17} /></button>
                      <button type="button" aria-label={`Folie ${index + 1} nach unten`} disabled={index === slides.length - 1} onClick={() => move(index, index + 1)} className="grid h-11 w-11 place-items-center rounded-full text-[#10261e]/60 hover:bg-[#f4f0e8] disabled:opacity-30"><ArrowDown size={17} /></button>
                      <button type="button" aria-expanded={open} aria-controls={`slide-form-${slide.id}`} onClick={() => setEditing(open ? null : slide.id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-[#f4f0e8]"><Pencil size={15} />{open ? "Schließen" : "Bearbeiten"}</button>
                      <button type="button" aria-label={`Folie ${index + 1} duplizieren`} disabled={full} onClick={() => duplicate(index)} className="grid h-11 w-11 place-items-center rounded-full text-[#10261e]/60 hover:bg-[#f4f0e8] disabled:opacity-30"><Copy size={16} /></button>
                      <button type="button" aria-label={`Folie ${index + 1} löschen`} onClick={() => setRemove(index)} className="grid h-11 w-11 place-items-center rounded-full text-[#a52520] hover:bg-red-50"><Trash2 size={16} /></button>
                    </span>
                  </div>
                  {open && <SlideForm id={`slide-form-${slide.id}`} slide={slide} index={index} initialLanguage={language} errors={errors} uploading={uploading} uploadMedia={uploadMedia} update={update} />}
                </li>
              );
            })}
          </ol>
        )}
        {full && <p className="mt-3 text-xs text-[#10261e]/50">Höchstens {MAX_HERO_SLIDES} Folien.</p>}
      </section>

      <AdminConfirmDialog open={toRemove !== null} title="Folie löschen?" confirmLabel="Folie löschen" danger onConfirm={() => { if (remove !== null) change((copy) => { copy.heroCarousel.slides = copy.heroCarousel.slides.filter((_, position) => position !== remove).map((slide, position) => ({ ...slide, order: position })); }); setRemove(null); }} onCancel={() => setRemove(null)}>
        <p>„{toRemove?.headline.de || "Neue Folie"}“ verschwindet nach dem Veröffentlichen von der Startseite. Nur ausblenden geht mit „Aktiv“. Bis zum Veröffentlichen holt „Verwerfen“ die Folie zurück.</p>
      </AdminConfirmDialog>
    </>
  );
}

function SlideForm({ id, slide, index, initialLanguage, errors, uploading, uploadMedia, update }: {
  id: string; slide: HeroSlide; index: number; initialLanguage: Lang; errors: ReturnType<typeof heroSlideErrors>; uploading: boolean;
  uploadMedia: SectionProps["uploadMedia"]; update: (index: number, mutate: (slide: HeroSlide) => void) => void;
}) {
  const [lang, setLang] = useState<Lang>(initialLanguage);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);
  const setText = (field: TextField, value: string) => update(index, (draft) => { draft[field][lang] = value; });

  async function upload(file: File) {
    setBusy(true);
    const result = await uploadMedia(file, "image", "hero");
    setBusy(false);
    if (result) update(index, (draft) => { draft.image = result.url; });
  }

  const field = (name: TextField, label: string, hint?: string, multiline = false) => {
    const value = slide[name][lang], placeholder = lang === "en" && slide[name].de ? slide[name].de : undefined;
    const common = { value, maxLength: HERO_LIMITS[name], placeholder, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(name, event.target.value), className: "rounded-xl border px-3 py-2.5 text-base" };
    return (
      <label className="grid gap-1 text-sm">
        <span className="flex justify-between gap-2"><span>{label} · {lang.toUpperCase()}</span><span className="text-xs text-[#10261e]/45">{value.length}/{HERO_LIMITS[name]}</span></span>
        {multiline ? <textarea rows={3} {...common} /> : <input {...common} className={`min-h-11 ${common.className}`} />}
        {hint && <span className="text-xs text-[#10261e]/50">{hint}</span>}
      </label>
    );
  };

  return (
    <div id={id} className="mt-4 grid gap-5 border-t border-[#10261e]/10 pt-4 lg:grid-cols-[1fr_minmax(0,420px)]">
      <div className="grid content-start gap-4">
        <div role="tablist" aria-label="Sprache der Folie" className="flex gap-2">
          {(["de", "en"] as const).map((code) => (
            <button key={code} type="button" role="tab" aria-selected={lang === code} onClick={() => setLang(code)} className={`min-h-11 rounded-full px-4 text-sm font-semibold ${lang === code ? "bg-[#10261e] text-white" : "border border-[#10261e]/15 hover:bg-[#f4f0e8]"}`}>{code === "de" ? "Deutsch" : "English"}</button>
          ))}
        </div>

        <div className="grid gap-2 text-sm">
          <span>Bild (JPG, PNG, WebP oder AVIF, höchstens 5 MB)</span>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={uploading} onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#10261e]/15 px-4 font-semibold hover:bg-[#f4f0e8] disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}{slide.image ? "Bild ersetzen" : "Bild hochladen"}</button>
            {errors.image && <span className="text-sm text-[#991B1B]">{errors.image}</span>}
          </div>
          <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
        </div>
        {field("alt", "Bildbeschreibung", "Für Screenreader und Google, z. B. „Gedeckter Tisch auf der Terrasse“.")}
        {field("badge", "Kennzeichnung", "Das kleine Etikett über der Überschrift, z. B. „Willkommen“.")}
        {field("headline", "Überschrift")}
        {errors.headline && <p className="-mt-2 text-sm text-[#991B1B]">{errors.headline}</p>}
        {field("subline", "Text (optional)", undefined, true)}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("ctaLabel", "Button-Text (optional)")}
          <label className="grid gap-1 text-sm">Button-Ziel
            <input value={slide.ctaHref} maxLength={HERO_LIMITS.ctaHref} placeholder="/reservieren oder #reservieren" onChange={(event) => update(index, (draft) => { draft.ctaHref = event.target.value; })} className="min-h-11 rounded-xl border px-3 text-base" />
            <span className="text-xs text-[#10261e]/50">Seite (/menu), Sprungmarke (#reservieren) oder https-Adresse. Für beide Sprachen.</span>
          </label>
        </div>
        {(errors.ctaHref || errors.ctaLabel) && <p className="-mt-2 text-sm text-[#991B1B]">{errors.ctaHref || errors.ctaLabel}</p>}
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-1 text-sm">Zeitraum (optional, für beide Sprachen)</legend>
          <label className="grid gap-1 text-sm">Ab<input type="date" value={slide.startsAt} max={slide.endsAt || undefined} onChange={(event) => update(index, (draft) => { draft.startsAt = event.target.value; })} className="min-h-11 rounded-xl border px-3 text-base" /></label>
          <label className="grid gap-1 text-sm">Bis<input type="date" value={slide.endsAt} min={slide.startsAt || undefined} onChange={(event) => update(index, (draft) => { draft.endsAt = event.target.value; })} className="min-h-11 rounded-xl border px-3 text-base" /></label>
        </fieldset>
        {errors.dates && <p className="-mt-2 text-sm text-[#991B1B]">{errors.dates}</p>}
        {errors.length && <p className="text-sm text-[#991B1B]">{errors.length}</p>}
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-sm font-semibold">Vorschau · {lang === "de" ? "Deutsch" : "English"}</p>
        <SlidePreview slide={slide} lang={lang} />
      </div>
    </div>
  );
}

// Small copy of the homepage slide with the same gradient, badge, headline and button style.
function SlidePreview({ slide, lang }: { slide: HeroSlide; lang: Lang }) {
  const text = (field: TextField) => slide[field][lang].trim() || slide[field].de.trim();
  const headline = text("headline") || "Überschrift";
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#09130f] text-left [container-type:inline-size]">
      {slide.image ? <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-sm text-white/50">Noch kein Bild</div>}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,13,10,.9)_0%,rgba(5,13,10,.62)_42%,rgba(5,13,10,.1)_78%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#09130f] via-[#09130f]/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        {text("badge") && <span className="inline-flex rounded-full bg-[#f5e8d3] px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-[.2em] text-[#10261e]">{text("badge")}</span>}
        <p className={`font-display mt-2 text-[#f5e8d3] [text-shadow:0_2px_24px_rgba(0,0,0,.45)] ${heroTitleClass(headline).replace(/text-\[clamp\([^\]]+\)\]/, "text-[clamp(1.4rem,7cqi,2.4rem)]")}`}>{headline}</p>
        {text("subline") && <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/75">{text("subline")}</p>}
        {text("ctaLabel") && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#a52520] px-3 py-1.5 text-xs font-semibold text-white">{text("ctaLabel")}<ArrowRight size={13} /></span>}
      </div>
    </div>
  );
}
