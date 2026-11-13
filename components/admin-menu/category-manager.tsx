"use client";
// "Kategorien verwalten": a collapsible panel to rename, reorder (drag or ⋯ menu), set images and delete categories.
import { useRef, useState } from "react";
import { AlertDialog, DropdownMenu } from "radix-ui";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, ImageOff, ImagePlus, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { MenuContent } from "../../lib/menu-content";
import { canDeleteCategory, categoryOrderChanged, dishCountByCategory } from "../../lib/menu-admin";

type Props = {
  menu: MenuContent;
  saved: MenuContent | null;
  language: "de" | "en";
  change: (mutator: (copy: MenuContent) => void) => void;
  onAdd: () => void;
  onMove: (from: number, to: number) => void;
  onDelete: (id: string) => void;
  onUploadImage: (index: number, file: File) => Promise<void>;
};

export function CategoryManager({ menu, saved, language, change, onAdd, onMove, onDelete, onUploadImage }: Props) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const fileInputs = useRef<Array<HTMLInputElement | null>>([]);
  const counts = dishCountByCategory(menu);
  const orderChanged = categoryOrderChanged(saved, menu);
  const confirmCategory = menu.categories.find((category) => category.id === confirm);
  const check = confirm ? canDeleteCategory(menu, confirm) : null;

  async function upload(index: number, file: File) {
    setUploading(index);
    try { await onUploadImage(index, file); } finally { setUploading(null); }
  }

  function endDrag() { setArmed(null); setDragging(null); setOver(null); }

  return (
    <section className="mt-6 rounded-[2rem] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-7">
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="kategorien-panel" className="flex items-center gap-3 text-left">
          <ChevronDown size={20} className={`shrink-0 text-[#a52520] transition-transform ${open ? "" : "-rotate-90"}`} />
          <span>
            <span className="font-display block text-2xl">Kategorien verwalten</span>
            <span className="block text-sm text-[#10261e]/55">
              {menu.categories.length} Kategorien · {language.toUpperCase()}
              {orderChanged && <span className="ml-2 font-semibold text-[#b8782e]">· Reihenfolge geändert, noch nicht veröffentlicht</span>}
            </span>
          </span>
        </button>
        {open && (
          <button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#a52520] hover:bg-[#f4f0e8]">
            <Plus size={17} /> Kategorie
          </button>
        )}
      </div>

      {open && (
        <div id="kategorien-panel" className="border-t border-[#10261e]/10 p-5 sm:px-7">
          <p className="mb-3 text-sm text-[#10261e]/55">Zum Sortieren am Griff ziehen oder über das ⋯-Menü verschieben. Die Reihenfolge gilt auch auf der Website.</p>
          <ol className="grid gap-2">
            {menu.categories.map((category, index) => (
              <li
                key={category.id}
                draggable={armed === index}
                onDragStart={(event) => { setDragging(index); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", category.id); }}
                onDragOver={(event) => { if (dragging === null) return; event.preventDefault(); setOver(index); }}
                onDrop={(event) => { event.preventDefault(); if (dragging !== null) onMove(dragging, index); endDrag(); }}
                onDragEnd={endDrag}
                className={`flex items-center gap-2 rounded-xl bg-[#f4f0e8] p-2 pr-1 transition sm:gap-3 ${dragging === index ? "opacity-40" : ""} ${over === index && dragging !== index ? "ring-2 ring-[#c68a3b]" : ""}`}
              >
                <span
                  aria-hidden="true"
                  title="Ziehen zum Sortieren"
                  onPointerDown={() => setArmed(index)}
                  onPointerUp={() => setArmed(null)}
                  className="hidden cursor-grab touch-none px-1 text-[#10261e]/35 hover:text-[#10261e] active:cursor-grabbing sm:block"
                >
                  <GripVertical size={18} />
                </span>
                <button
                  type="button"
                  onClick={() => fileInputs.current[index]?.click()}
                  aria-label={category.image ? `Bild für ${category.name.de} ersetzen` : `Bild für ${category.name.de} hochladen`}
                  title={category.image ? "Bild ersetzen" : "Bild hochladen"}
                  className="group relative grid h-12 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-[#10261e]/20 bg-white text-[#10261e]/40"
                >
                  {category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={18} />}
                  <span className={`absolute inset-0 grid place-items-center bg-[#10261e]/55 text-white transition ${uploading === index ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                    {uploading === index ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                  </span>
                </button>
                <input
                  ref={(element) => { fileInputs.current[index] = element; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(index, file); event.target.value = ""; }}
                />
                <input
                  aria-label={`Name der Kategorie ${index + 1} (${language.toUpperCase()})`}
                  value={category.name[language]}
                  onChange={(event) => change((copy) => { copy.categories[index].name[language] = event.target.value; })}
                  className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 font-semibold outline-none focus:bg-white"
                />
                <span className="hidden shrink-0 text-sm text-[#10261e]/50 sm:inline">{counts[category.id] ?? 0} {(counts[category.id] ?? 0) === 1 ? "Gericht" : "Gerichte"}</span>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button type="button" aria-label={`Aktionen für ${category.name.de}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#10261e]/60 hover:bg-white hover:text-[#10261e]">
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" sideOffset={4} className="admin-area z-50 min-w-52 rounded-xl border border-[#10261e]/10 bg-white p-1 text-sm text-[#10261e] shadow-lg">
                      <MenuItem disabled={index === 0} onSelect={() => onMove(index, index - 1)}><ArrowUp size={16} />Nach oben</MenuItem>
                      <MenuItem disabled={index === menu.categories.length - 1} onSelect={() => onMove(index, index + 1)}><ArrowDown size={16} />Nach unten</MenuItem>
                      <MenuItem onSelect={() => fileInputs.current[index]?.click()}><ImagePlus size={16} />{category.image ? "Bild ersetzen" : "Bild hochladen"}</MenuItem>
                      {category.image && <MenuItem onSelect={() => change((copy) => { delete copy.categories[index].image; })}><ImageOff size={16} />Bild entfernen</MenuItem>}
                      <DropdownMenu.Separator className="my-1 h-px bg-[#10261e]/10" />
                      <MenuItem danger onSelect={() => setConfirm(category.id)}><Trash2 size={16} />Kategorie löschen</MenuItem>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </li>
            ))}
          </ol>
        </div>
      )}

      <AlertDialog.Root open={confirm !== null} onOpenChange={(value) => { if (!value) setConfirm(null); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] bg-white p-6 text-[#10261e] shadow-2xl">
            <AlertDialog.Title className="font-display text-2xl">Kategorie „{confirmCategory?.name.de}“ löschen?</AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#10261e]/70">
              {check?.ok
                ? "Diese Kategorie enthält keine Gerichte. Die Löschung wird mit „Beide Sprachen veröffentlichen“ auf der Website übernommen."
                : check?.reason}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <AlertDialog.Cancel className="min-h-11 rounded-full border border-[#10261e]/20 px-5 text-sm font-semibold hover:bg-[#f4f0e8]">
                {check?.ok ? "Abbrechen" : "Verstanden"}
              </AlertDialog.Cancel>
              {check?.ok && (
                <AlertDialog.Action onClick={() => confirm && onDelete(confirm)} className="min-h-11 rounded-full bg-[#a52520] px-5 text-sm font-semibold text-white hover:bg-[#bf3029]">
                  Kategorie löschen
                </AlertDialog.Action>
              )}
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}

function MenuItem({ children, onSelect, disabled, danger }: { children: React.ReactNode; onSelect: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 outline-none data-[disabled]:cursor-default data-[disabled]:opacity-35 data-[highlighted]:bg-[#f4f0e8] ${danger ? "text-[#a52520]" : ""}`}
    >
      {children}
    </DropdownMenu.Item>
  );
}
