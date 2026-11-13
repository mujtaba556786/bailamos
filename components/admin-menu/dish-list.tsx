"use client";
// Left pane of the Speisekarte admin: search, category chips and the dish list grouped by category.
import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import type { MenuContent } from "../../lib/menu-content";
import { dishCountByCategory, formatPrice, groupDishes } from "../../lib/menu-admin";

type Props = {
  menu: MenuContent;
  language: "de" | "en";
  selected: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function DishList({ menu, language, selected, onSelect, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const groups = useMemo(() => groupDishes(menu, query, filter), [menu, query, filter]);
  const counts = useMemo(() => dishCountByCategory(menu), [menu]);
  const searching = query.trim() !== "";
  const shownCount = groups.reduce((sum, group) => sum + group.dishes.length, 0);

  const toggleFilter = (id: string) => setFilter((list) => (list.includes(id) ? list.filter((value) => value !== id) : [...list, id]));
  const toggleCollapsed = (id: string) => setCollapsed((list) => (list.includes(id) ? list.filter((value) => value !== id) : [...list, id]));

  return (
    <div className="flex min-h-0 flex-col lg:h-full">
      <div className="space-y-3 border-b border-[#10261e]/10 p-4">
        <div className="flex gap-2">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl bg-[#f4f0e8] px-3">
            <Search size={17} className="shrink-0 text-[#10261e]/50" />
            <input aria-label="Gerichte suchen" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gericht suchen" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
            {query && (
              <button type="button" aria-label="Suche leeren" onClick={() => setQuery("")} className="grid h-7 w-7 place-items-center rounded-full text-[#10261e]/50 hover:bg-white">
                <X size={15} />
              </button>
            )}
          </label>
          <button type="button" onClick={onAdd} aria-label="Gericht hinzufügen" title="Gericht hinzufügen" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#10261e] text-white hover:bg-[#1c3a2f]">
            <Plus size={18} />
          </button>
        </div>
        <div role="group" aria-label="Nach Kategorie filtern" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip active={!filter.length} onClick={() => setFilter([])}>
            Alle <span className="opacity-60">{menu.dishes.length}</span>
          </Chip>
          {menu.categories.map((category) => (
            <Chip key={category.id} active={filter.includes(category.id)} onClick={() => toggleFilter(category.id)}>
              {category.name[language] || category.name.de} <span className="opacity-60">{counts[category.id] ?? 0}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
        {!shownCount && (searching || filter.length > 0) ? (
          <div className="p-8 text-center text-sm text-[#10261e]/55">
            <p>Keine Gerichte gefunden.</p>
            <button type="button" onClick={() => { setQuery(""); setFilter([]); }} className="mt-3 font-semibold text-[#a52520] underline underline-offset-4">
              Suche und Filter zurücksetzen
            </button>
          </div>
        ) : (
          groups.map(({ category, dishes }) => {
            const open = searching || !collapsed.includes(category.id);
            return (
              <section key={category.id} aria-label={category.name.de}>
                <h3 className="sticky top-0 z-10">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(category.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2 border-b border-[#10261e]/10 bg-[#faf7f1]/95 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[.14em] text-[#10261e]/60 backdrop-blur hover:text-[#10261e]"
                  >
                    <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
                    <span className="min-w-0 flex-1 truncate">{category.name[language] || category.name.de}</span>
                    <span className="font-normal normal-case tracking-normal">{dishes.length}</span>
                  </button>
                </h3>
                {open &&
                  (dishes.length ? (
                    <div className="divide-y divide-[#10261e]/10">
                      {dishes.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => onSelect(item.id)}
                          aria-current={selected === item.id ? "true" : undefined}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left ${selected === item.id ? "bg-[#fff8ec]" : "hover:bg-[#f4f0e8]"}`}
                        >
                          <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate">{item.name.de}</strong>
                            <span className="mt-0.5 block text-sm text-[#10261e]/50">
                              {formatPrice(item.price)} · {item.available ? "Verfügbar" : "Pausiert"}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm text-[#10261e]/45">Noch keine Gerichte in dieser Kategorie.</p>
                  ))}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-semibold transition ${active ? "border-[#10261e] bg-[#10261e] text-white" : "border-[#10261e]/15 bg-white text-[#10261e]/70 hover:border-[#10261e]/40"}`}
    >
      {children}
    </button>
  );
}
