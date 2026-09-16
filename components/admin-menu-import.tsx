"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FolderOpen, Loader2, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";
import type { MenuContent } from "../lib/menu-content";

type ImportRow = {
  dishId: string;
  categoryId: string;
  categoryDe: string;
  categoryEn: string;
  dishDe: string;
  dishEn: string;
  descriptionDe: string;
  descriptionEn: string;
  price: number;
  available: boolean;
  vegetarian: boolean;
  spicy: number;
  allergens: string[];
  imageFile: string;
  matchedImage?: File;
  isNew: boolean;
  errors: string[];
};

const columns = ["dish_id","category_id","category_de","category_en","dish_de","dish_en","description_de","description_en","price_eur","available","vegetarian","spicy","allergens","image_file"];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const baseName = (value:string) => value.replaceAll("\\","/").split("/").pop()!.trim().toLowerCase();
const bool = (value:unknown) => ["1","true","yes","ja","x"].includes(String(value??"").trim().toLowerCase());
const cell = (row:Record<string,unknown>,key:string) => String(row[key]??"").trim();

export function AdminMenuImport({adminKey,menu,onApply}:{adminKey:string;menu:MenuContent;onApply:(menu:MenuContent)=>void}){
  const [sheet,setSheet]=useState<File|null>(null),[images,setImages]=useState<File[]>([]),[rows,setRows]=useState<ImportRow[]>([]),[parsing,setParsing]=useState(false),[applying,setApplying]=useState(false),[error,setError]=useState(""),[expanded,setExpanded]=useState(false);
  const imageMap=useMemo(()=>{const map=new Map<string,File[]>();for(const image of images){const key=baseName(image.name),list=map.get(key)||[];list.push(image);map.set(key,list)}return map},[images]);
  const summary=useMemo(()=>({newItems:rows.filter(row=>row.isNew).length,updates:rows.filter(row=>!row.isNew).length,matched:rows.filter(row=>row.matchedImage).length,errors:rows.reduce((count,row)=>count+row.errors.length,0)}),[rows]);

  function downloadTemplate(){
    const data=menu.dishes.map(dish=>{const category=menu.categories.find(item=>item.id===dish.categoryId)!;return{dish_id:dish.id,category_id:dish.categoryId,category_de:category.name.de,category_en:category.name.en,dish_de:dish.name.de,dish_en:dish.name.en,description_de:dish.description.de,description_en:dish.description.en,price_eur:dish.price,available:dish.available?1:0,vegetarian:dish.vegetarian?1:0,spicy:dish.spicy,allergens:dish.allergens.join(", "),image_file:`${dish.id}.jpg`}});
    const workbook=XLSX.utils.book_new(),worksheet=XLSX.utils.json_to_sheet(data,{header:columns});
    worksheet["!cols"]=[{wch:24},{wch:22},{wch:22},{wch:22},{wch:28},{wch:28},{wch:54},{wch:54},{wch:12},{wch:12},{wch:12},{wch:9},{wch:28},{wch:30}];
    XLSX.utils.book_append_sheet(workbook,worksheet,"Speisekarte");
    const bytes=XLSX.write(workbook,{bookType:"xlsx",type:"array"}),url=URL.createObjectURL(new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})),anchor=document.createElement("a");
    anchor.href=url;anchor.download="bailamos-speisekarte.xlsx";document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function prepare(){
    if(!sheet){setError("Bitte zuerst eine Excel- oder CSV-Datei auswählen.");return}
    setParsing(true);setError("");
    try{
      const workbook=XLSX.read(await sheet.arrayBuffer(),{type:"array"}),worksheet=workbook.Sheets[workbook.SheetNames[0]],rawRows=XLSX.utils.sheet_to_json<Record<string,unknown>>(worksheet,{defval:"",raw:false});
      if(!rawRows.length)throw new Error("Die Tabelle enthält keine Gerichte.");
      const normalized=rawRows.map(source=>Object.fromEntries(Object.entries(source).map(([key,value])=>[key.trim().toLowerCase(),value])));
      const seen=new Set<string>();
      const parsed=normalized.map(source=>{
        const dishId=cell(source,"dish_id").toLowerCase(),categoryId=cell(source,"category_id").toLowerCase(),existing=menu.dishes.find(item=>item.id===dishId),imageFile=cell(source,"image_file")||`${dishId}.jpg`,errors:string[]=[];
        if(!slugPattern.test(dishId))errors.push("Ungültige dish_id");if(seen.has(dishId))errors.push("Doppelte dish_id");seen.add(dishId);
        if(!slugPattern.test(categoryId))errors.push("Ungültige category_id");if(!cell(source,"dish_de"))errors.push("Deutscher Name fehlt");if(!cell(source,"description_de"))errors.push("Deutsche Beschreibung fehlt");
        const price=Number(cell(source,"price_eur").replace(",","."));if(!Number.isFinite(price)||price<0||price>999)errors.push("Preis ist ungültig");
        const exact=imageMap.get(baseName(imageFile))||[],fallback=[...imageMap.entries()].filter(([name])=>name.replace(/\.(jpe?g|png|webp)$/i,"")===dishId).flatMap(([,files])=>files),matches=exact.length?exact:fallback;
        if(matches.length>1)errors.push("Mehrere Bilder passen");if(!matches.length&&!existing)errors.push("Bild für neues Gericht fehlt");
        return{dishId,categoryId,categoryDe:cell(source,"category_de"),categoryEn:cell(source,"category_en"),dishDe:cell(source,"dish_de"),dishEn:cell(source,"dish_en"),descriptionDe:cell(source,"description_de"),descriptionEn:cell(source,"description_en"),price,available:bool(source.available),vegetarian:bool(source.vegetarian),spicy:Math.max(0,Math.min(3,Math.trunc(Number(cell(source,"spicy"))||0))),allergens:cell(source,"allergens").split(",").map(value=>value.trim()).filter(Boolean),imageFile,matchedImage:matches[0],isNew:!existing,errors} satisfies ImportRow;
      });
      setRows(parsed);
    }catch(cause){setRows([]);setError(cause instanceof Error?cause.message:"Tabelle konnte nicht gelesen werden.")}
    finally{setParsing(false)}
  }

  async function uploadImage(file:File){const response=await fetch("/api/admin/media",{method:"POST",headers:{"x-admin-key":adminKey,"content-type":file.type},body:file}),result=await response.json() as any;if(!response.ok)throw new Error(result.error||`Bild ${file.name} konnte nicht hochgeladen werden.`);return result.url as string}

  async function apply(){
    if(!rows.length||summary.errors){setError("Bitte zuerst alle Importfehler korrigieren.");return}
    setApplying(true);setError("");
    try{
      const next=structuredClone(menu),uploaded=new Map<string,string>();
      for(const row of rows)if(row.matchedImage){const key=baseName(row.matchedImage.name);if(!uploaded.has(key))uploaded.set(key,await uploadImage(row.matchedImage))}
      for(const row of rows){
        const category=next.categories.find(item=>item.id===row.categoryId);if(category){if(row.categoryDe)category.name.de=row.categoryDe;if(row.categoryEn)category.name.en=row.categoryEn}else next.categories.push({id:row.categoryId,name:{de:row.categoryDe||row.categoryId,en:row.categoryEn||row.categoryDe||row.categoryId}});
        const existing=next.dishes.find(item=>item.id===row.dishId),image=row.matchedImage?uploaded.get(baseName(row.matchedImage.name))!:(existing?.image||"");
        const dish={id:row.dishId,categoryId:row.categoryId,name:{de:row.dishDe,en:row.dishEn||row.dishDe},description:{de:row.descriptionDe,en:row.descriptionEn||row.descriptionDe},price:row.price,image,featured:existing?.featured===true,available:row.available,vegetarian:row.vegetarian,spicy:row.spicy,allergens:row.allergens};
        if(existing)Object.assign(existing,dish);else next.dishes.push(dish);
      }
      onApply(next);setRows([]);setSheet(null);setImages([]);setExpanded(false);
    }catch(cause){setError(cause instanceof Error?cause.message:"Import konnte nicht übernommen werden.")}
    finally{setApplying(false)}
  }

  return <section className="mt-7 rounded-[2rem] border border-[#c68a3b]/25 bg-[#fffaf1] p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#a52520]">Schnellimport</p><h2 className="font-display mt-1 text-3xl">Excel und Bilder</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#10261e]/60">Gerichte gesammelt bearbeiten. Bilder werden über <code>dish_id</code> und den Dateinamen zugeordnet. Änderungen bleiben bis zur Veröffentlichung ein Entwurf.</p></div><div className="flex flex-wrap gap-3"><button onClick={downloadTemplate} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#10261e]/20 bg-white px-4 text-sm font-semibold"><FileSpreadsheet size={18}/>Aktuelle Karte als Excel</button><button onClick={()=>setExpanded(value=>!value)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#10261e] px-5 text-sm font-semibold text-white"><UploadCloud size={18}/>{expanded?"Import schließen":"Import starten"}</button></div></div>
    {expanded&&<div className="mt-6 border-t border-[#c68a3b]/20 pt-6"><div className="grid gap-4 md:grid-cols-3"><label className="grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-[#10261e]/25 bg-white p-4 text-center"><span><FileSpreadsheet className="mx-auto text-[#a52520]"/><strong className="mt-2 block">Excel oder CSV</strong><small className="mt-1 block text-[#10261e]/55">{sheet?.name||".xlsx, .xls oder .csv"}</small></span><input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={event=>{setSheet(event.target.files?.[0]||null);setRows([])}}/></label><label className="grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-[#10261e]/25 bg-white p-4 text-center"><span><FolderOpen className="mx-auto text-[#a52520]"/><strong className="mt-2 block">Bilder auswählen</strong><small className="mt-1 block text-[#10261e]/55">{images.length?`${images.length} Bilder ausgewählt`:"JPG, PNG oder WebP"}</small></span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>{setImages(Array.from(event.target.files||[]));setRows([])}}/></label><label className="grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-[#10261e]/25 bg-white p-4 text-center"><span><FolderOpen className="mx-auto text-[#a52520]"/><strong className="mt-2 block">Ganzen Bildordner wählen</strong><small className="mt-1 block text-[#10261e]/55">Dateinamen werden automatisch geprüft</small></span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple {...({webkitdirectory:""} as any)} onChange={event=>{setImages(Array.from(event.target.files||[]));setRows([])}}/></label></div><button disabled={parsing||!sheet} onClick={prepare} className="button-primary mt-4 disabled:opacity-45">{parsing?<Loader2 className="animate-spin" size={18}/>:<CheckCircle2 size={18}/>}Import prüfen</button>
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {!!rows.length&&<div className="mt-6"><div className="grid gap-3 sm:grid-cols-4"><Stat label="Neue Gerichte" value={summary.newItems}/><Stat label="Aktualisierungen" value={summary.updates}/><Stat label="Bilder zugeordnet" value={summary.matched}/><Stat label="Fehler" value={summary.errors} warning={summary.errors>0}/></div><div className="mt-4 overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f4f0e8]"><tr><th className="p-3">Gericht</th><th className="p-3">Kategorie</th><th className="p-3">Preis</th><th className="p-3">Bild</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y">{rows.map((row,index)=><tr key={`${row.dishId}-${index}`}><td className="p-3"><strong>{row.dishDe||row.dishId}</strong><small className="block text-[#10261e]/50">{row.dishId}</small></td><td className="p-3">{row.categoryDe||row.categoryId}</td><td className="p-3">€ {Number.isFinite(row.price)?row.price.toFixed(2).replace(".",","):"–"}</td><td className="p-3">{row.matchedImage?.name||(row.isNew?"Fehlt":"Vorhandenes Bild")}</td><td className="p-3">{row.errors.length?<span className="inline-flex items-center gap-2 text-red-700"><AlertTriangle size={16}/>{row.errors.join(", ")}</span>:<span className="text-emerald-700">Bereit</span>}</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-[#10261e]/60">Nach der Übernahme bitte oben „Beide Sprachen veröffentlichen“ wählen.</p><button disabled={applying||summary.errors>0} onClick={apply} className="button-primary disabled:opacity-45">{applying?<Loader2 className="animate-spin" size={18}/>:<UploadCloud size={18}/>}In Entwurf übernehmen</button></div></div>}
    </div>}
  </section>;
}

function Stat({label,value,warning=false}:{label:string;value:number;warning?:boolean}){return <div className={`rounded-2xl p-4 ${warning?"bg-red-50 text-red-800":"bg-white"}`}><strong className="text-2xl">{value}</strong><span className="mt-1 block text-sm opacity-65">{label}</span></div>}
