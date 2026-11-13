"use client";
// Sub-tab "Startseite": announcement, photo tiles and "Unsere Lieblinge".
import type { SectionProps } from "./types";
import { DishPicker } from "./dish-picker";
import { setFavourite, type PickerCategory, type PickerDish } from "../../lib/content-admin";


export function HomeSection({ content, language, change, uploading, uploadMedia, menuDishes, menuCategories }: SectionProps & { menuDishes: PickerDish[]; menuCategories: PickerCategory[] }) {
  async function uploadStoryImage(index: number, file: File) { const result = await uploadMedia(file, "image"); if (result) change((copy) => { copy.storyTiles[index].image = result.url; }); }
  function moveStoryTile(index: number, direction: number) { change((copy) => { const target = index + direction; if (target < 0 || target >= copy.storyTiles.length) return; [copy.storyTiles[index], copy.storyTiles[target]] = [copy.storyTiles[target], copy.storyTiles[index]]; }); }
  return <>
    <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div><h2 className="font-display text-3xl">Startseite · Ankündigung</h2><p className="mt-1 text-sm text-[#10261e]/55">Das „NEU“-Feld im Karussell der Startseite. Ausschalten, um es zu entfernen.</p></div>
      {content&&<div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={content.announcement.enabled} onChange={e=>change(copy=>copy.announcement.enabled=e.target.checked)} className="h-5 w-5"/>Ankündigung auf der Startseite zeigen</label>
        <label className="grid gap-1 text-sm sm:col-span-2">Text · {language.toUpperCase()}<input value={content.announcement[language]} maxLength={180} onChange={e=>change(copy=>copy.announcement[language]=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
        <label className="grid gap-1 text-sm sm:col-span-2">Link<input value={content.announcement.link} maxLength={300} onChange={e=>change(copy=>copy.announcement.link=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
      </div>}
    </section>
    <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div><h2 className="font-display text-3xl">Startseite · Fotokacheln</h2><p className="mt-1 text-sm text-[#10261e]/55">Die Bildkacheln im Abschnitt „Wärme, die man sieht“ und darunter. Die ersten zwei stehen nebeneinander, die weiteren darunter. Reihenfolge mit den Pfeilen ändern.</p></div>
      {content&&<div className="mt-6 grid gap-5">{content.storyTiles.map((tile,index)=><article key={tile.id+index} className="grid gap-4 rounded-2xl border border-[#10261e]/10 p-4 sm:grid-cols-[180px_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#10261e]/5">{tile.image&&<img src={tile.image} alt="" className="h-full w-full object-cover"/>}</div>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm"><strong>Kachel {index+1}</strong>
            <label className="flex items-center gap-2"><input type="checkbox" checked={tile.show} onChange={e=>change(copy=>copy.storyTiles[index].show=e.target.checked)} className="h-5 w-5"/>Anzeigen</label>
            <button type="button" onClick={()=>moveStoryTile(index,-1)} disabled={index===0} className="rounded-full border px-3 py-1 disabled:opacity-40">↑</button>
            <button type="button" onClick={()=>moveStoryTile(index,1)} disabled={index===content.storyTiles.length-1} className="rounded-full border px-3 py-1 disabled:opacity-40">↓</button>
          </div>
          <label className="grid gap-1 text-sm">Titel · {language.toUpperCase()}<input value={tile.title[language]} maxLength={80} onChange={e=>change(copy=>copy.storyTiles[index].title[language]=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
          <label className="grid gap-1 text-sm">Kurztext (optional) · {language.toUpperCase()}<input value={tile.text[language]} maxLength={160} onChange={e=>change(copy=>copy.storyTiles[index].text[language]=e.target.value)} className="min-h-11 rounded-xl border px-3 text-base"/></label>
          <label className="grid gap-1 text-sm">Bild ersetzen<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadStoryImage(index,file);e.target.value=""}} className="min-h-11 rounded-xl border px-3 py-2 text-base"/></label>
        </div>
      </article>)}</div>}
    </section>
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
