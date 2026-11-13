"use client";
// Searchable dish picker for "Unsere Lieblinge", grouped by menu category.
// Keyboard: type to search, ↑/↓ to move, Enter to choose, Esc to close.
import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { dishOptions, type PickerCategory, type PickerDish } from "../../lib/content-admin";

type Props = {
  label: string;
  value: string;
  dishes: PickerDish[];
  categories: PickerCategory[];
  chosenElsewhere: string[];
  language: "de" | "en";
  onChange: (dishId: string) => void;
};

export function DishPicker({ label, value, dishes, categories, chosenElsewhere, language, onChange }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = dishes.find((dish) => dish.id === value);
  const groups = useMemo(() => dishOptions(dishes, categories, query, chosenElsewhere), [dishes, categories, query, chosenElsewhere]);
  const flat = groups.flatMap((group) => group.dishes);
  const choosable = flat.filter((item) => !item.taken);
  const activeItem = active >= 0 ? choosable[Math.min(active, choosable.length - 1)] : undefined;

  function choose(dishId: string) { onChange(dishId); setOpen(false); setQuery(""); }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => { if (!choosable.length) return -1; if (current < 0) return step > 0 ? 0 : choosable.length - 1; return (Math.min(current, choosable.length - 1) + step + choosable.length) % choosable.length; });
    } else if (event.key === "Enter" && open && activeItem) {
      event.preventDefault();
      choose(activeItem.dish.id);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false); setQuery("");
    }
  }

  const name = (dish: PickerDish) => dish.name[language] || dish.name.de;

  return (
    <div className="relative grid gap-1 text-sm">
      <label htmlFor={`${id}-input`}>{label}</label>
      <div className="flex min-h-11 items-center rounded-xl border bg-white focus-within:ring-2 focus-within:ring-[#c68a3b]">
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && activeItem ? `${id}-${activeItem.dish.id}` : undefined}
          value={open ? query : selected ? name(selected) : ""}
          placeholder={selected ? name(selected) : "Gericht suchen …"}
          onFocus={() => { setOpen(true); setActive(-1); }}
          onBlur={() => window.setTimeout(() => { setOpen(false); setQuery(""); }, 120)}
          onChange={(event) => { setQuery(event.target.value); setActive(-1); setOpen(true); }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
        />
        {selected && !open && <span className={`mr-1 shrink-0 rounded-full px-2 text-xs ${selected.available ? "hidden" : "bg-[#10261e]/8 text-[#10261e]/55"}`}>nicht verfügbar</span>}
        {value ? (
          <button type="button" aria-label={`${label} entfernen`} onClick={() => choose("")} className="grid h-11 w-10 shrink-0 place-items-center text-[#10261e]/50 hover:text-[#a52520]"><X size={16} /></button>
        ) : (
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => inputRef.current?.focus()} className="grid h-11 w-10 shrink-0 place-items-center text-[#10261e]/40"><ChevronDown size={16} /></button>
        )}
      </div>
      {open && (
        <div id={`${id}-list`} role="listbox" aria-label={label} className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[#10261e]/10 bg-white py-1 shadow-xl">
          {groups.length === 0 && <p className="px-3 py-2 text-[#10261e]/55">Kein Gericht gefunden.</p>}
          {groups.map(({ category, dishes: items }) => (
            <div key={category.id || "weitere"} role="group" aria-label={category.name.de}>
              <p className="sticky top-0 bg-white px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#10261e]/45">{category.name[language] || category.name.de}</p>
              {items.map(({ dish, taken }) => {
                const isActive = activeItem?.dish.id === dish.id;
                return (
                  <div
                    key={dish.id}
                    id={`${id}-${dish.id}`}
                    role="option"
                    aria-selected={dish.id === value}
                    aria-disabled={taken}
                    onMouseDown={(event) => { event.preventDefault(); if (!taken) choose(dish.id); }}
                    onMouseEnter={() => { if (!taken) setActive(choosable.findIndex((item) => item.dish.id === dish.id)); }}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 ${taken ? "cursor-not-allowed text-[#10261e]/35" : isActive ? "bg-[#f4f0e8]" : ""} ${dish.id === value ? "font-semibold" : ""}`}
                  >
                    <span className="truncate">{name(dish)}</span>
                    <span className="shrink-0 text-xs text-[#10261e]/45">{taken ? "bereits gewählt" : dish.available ? "" : "nicht verfügbar"}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
