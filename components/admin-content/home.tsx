"use client";
// Sub-tab "Startseite": announcement, photo tiles and "Unsere Lieblinge".
import type { SectionProps } from "./types";
import { DishPicker } from "./dish-picker";
import { StoryTiles } from "./story-tiles";
import { setFavourite, type PickerCategory, type PickerDish } from "../../lib/content-admin";


export function HomeSection({ content, language, change, uploading, uploadMedia, menuDishes, menuCategories }: SectionProps & { menuDishes: PickerDish[]; menuCategories: PickerCategory[] }) {
  return <>
    <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div><h2 className="font-display text-3xl">Startseite · Ankündigung</h2><p className="mt-1 text-sm text-[#10261e]/55">Das „NEU“-Feld im Karussell der Startseite. Ausschalten, um es zu entfernen.</p></div>
      {content&&<div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={content.announcement.enabled} onChange={e=>change(copy=>copy.announcement.enabled=e.target.checked)} className="h-5 w-5"/>Ankündigung auf der Startseite zeigen</label>
        <label className="grid gap-1 text-sm sm:col-span-2">Text · {language.toUpperCase()}<input value={content.announcement[language]} maxLength={180} onChange={e=>change(copy=>copy.announcement[language]=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
        <label className="grid gap-1 text-sm sm:col-span-2">Link<input value={content.announcement.link} maxLength={300} onChange={e=>change(copy=>copy.announcement.link=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
      </div>}
    </section>
    <StoryTiles content={content} language={language} change={change} uploading={uploading} uploadMedia={uploadMedia} />
    <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-3xl">Startseite · Unsere Lieblinge</h2><p className="mt-1 text-sm text-[#10261e]/55">Überschrift und bis zu drei Gerichte für den Abschnitt auf der Startseite. Ohne Auswahl werden die Gerichte mit „Neu auf der Karte“ aus der Speisekarte gezeigt.</p></div></div>
      {content&&<div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={content.favourites.enabled} onChange={e=>change(copy=>copy.favourites.enabled=e.target.checked)} className="h-5 w-5"/>Abschnitt auf der Startseite zeigen</label>
        <label className="grid gap-1 text-sm">Kleine Überschrift · {language.toUpperCase()}<input value={content.favourites.eyebrow[language]} onChange={e=>change(copy=>copy.favourites.eyebrow[language]=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
        <label className="grid gap-1 text-sm">Überschrift · {language.toUpperCase()}<input value={content.favourites.heading[language]} onChange={e=>change(copy=>copy.favourites.heading[language]=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
        {[0, 1, 2].map((slot) => <DishPicker key={slot} label={`Gericht ${slot + 1}`} value={content.favourites.dishIds[slot] ?? ""} dishes={menuDishes} categories={menuCategories} language={language} chosenElsewhere={content.favourites.dishIds.filter((_, index) => index !== slot)} onChange={(dishId) => change((copy) => { copy.favourites.dishIds = setFavourite(copy.favourites.dishIds, slot, dishId); })} />)}
      </div>}
    </section>
    
  </>;
}
