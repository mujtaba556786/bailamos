"use client";
// Left pane of the Speisekarte admin: search, category chips and the dish list grouped by category.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from "lucide-react";
import type { MenuContent } from "../../lib/menu-content";
import { dishBadges, dishCountByCategory, formatPrice, groupDishes, type MenuDish } from "../../lib/menu-admin";

type Props = {
  menu: MenuContent;
  language: "de" | "en";
  selected: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  published: MenuContent | null;
  toggling: string[];
  onToggleAvailable: (id: string, available: boolean) => void;
};

export function DishList({ menu, language, selected, onSelect, onAdd, published, toggling, onToggleAvailable }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const groups = useMemo(() => groupDishes(menu, query, filter), [menu, query, filter]);
  const counts = useMemo(() => dishCountByCategory(menu), [menu]);
  const searching = query.trim() !== "";
  const shownCount = groups.reduce((sum, group) => sum + group.dishes.length, 0);
  const publishedById = useMemo(() => new Map((published?.dishes ?? []).map((dish) => [dish.id, dish])), [published]);

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
        <ChipScroller>
          <Chip active={!filter.length} onClick={() => setFilter([])}>
            Alle <span className="opacity-60">{menu.dishes.length}</span>
          </Chip>
          {menu.categories.map((category) => (
            <Chip key={category.id} active={filter.includes(category.id)} onClick={() => toggleFilter(category.id)}>
              {category.name[language] || category.name.de} <span className="opacity-60">{counts[category.id] ?? 0}</span>
            </Chip>
          ))}
        </ChipScroller>
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
                    <div className="divide-y divide-[#10261e]/[0.06]">
                      {dishes.map((item) => (
                        <DishRow
                          key={item.id}
                          dish={item}
                          active={selected === item.id}
                          published={publishedById.get(item.id)}
                          toggling={toggling.includes(item.id)}
                          onSelect={() => onSelect(item.id)}
                          onToggle={() => onToggleAvailable(item.id, !item.available)}
                        />
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

function DishRow({ dish, active, published, toggling, onSelect, onToggle }: { dish: MenuDish; active: boolean; published: MenuDish | undefined; toggling: boolean; onSelect: () => void; onToggle: () => void }) {
  const badges = dishBadges(dish, published);
  const off = !dish.available;
  return (
    <div className={`flex h-16 items-center gap-1 pr-2 ${active ? "bg-[#fff8ec]" : "hover:bg-[#f4f0e8]/70"}`}>
      <button type="button" onClick={onSelect} aria-current={active ? "true" : undefined} className="flex h-full min-w-0 flex-1 items-center gap-3 pl-4 text-left">
        <img src={dish.image} alt="" className={`h-10 w-10 shrink-0 rounded-lg object-cover ${off ? "opacity-45 grayscale" : ""}`} />
        <span className="min-w-0 flex-1">
          <strong className={`block truncate text-[15px] leading-5 ${off ? "font-semibold text-[#10261e]/45" : ""}`}>{dish.name.de}</strong>
          <span className="mt-0.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs leading-4">
            <span className={off ? "text-[#10261e]/40" : "text-[#10261e]/55"}>{formatPrice(dish.price)}</span>
            {off && <Badge tone="muted">Ausverkauft</Badge>}
            {badges.draft && <Badge tone="draft">Entwurf</Badge>}
            {badges.enMissing && <Badge tone="warn">EN fehlt</Badge>}
            {badges.vegan && <Badge tone="veg">Vegan</Badge>}
            {badges.vegetarian && <Badge tone="veg">Vegetarisch</Badge>}
          </span>
        </span>
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={dish.available}
        aria-label={`${dish.name.de}: auf der Karte verfügbar`}
        title={dish.available ? "Verfügbar – tippen für ausverkauft" : "Ausverkauft – tippen für verfügbar"}
        disabled={toggling}
        onClick={onToggle}
        className="grid h-11 w-12 shrink-0 place-items-center rounded-full disabled:cursor-wait"
      >
        <span className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${dish.available ? "bg-[#10261e]" : "bg-[#10261e]/20"}`}>
          <span className={`grid h-5 w-5 place-items-center rounded-full bg-white shadow transition-transform ${dish.available ? "translate-x-[18px]" : "translate-x-0.5"}`}>
            {toggling && <Loader2 size={12} className="animate-spin text-[#10261e]/60" />}
          </span>
        </span>
      </button>
    </div>
  );
}

const badgeTones = {
  draft: "bg-[#c68a3b]/15 text-[#8a5a1c]",
  warn: "bg-[#a52520]/10 text-[#a52520]",
  veg: "bg-[#2f6b47]/12 text-[#2f6b47]",
  muted: "bg-[#10261e]/8 text-[#10261e]/55",
};

function Badge({ tone, children }: { tone: keyof typeof badgeTones; children: React.ReactNode }) {
  return <span className={`shrink-0 rounded-full px-1.5 py-px text-[11px] font-semibold ${badgeTones[tone]}`}>{children}</span>;
}

// Horizontal chip row. A normal mouse wheel scrolls it sideways, and arrow buttons plus a fade appear
// while more chips are hidden, because the scrollbar itself is hidden.
function ChipScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const update = () => setEdges({ left: row.scrollLeft > 2, right: row.scrollLeft + row.clientWidth < row.scrollWidth - 2 });
    // Turn vertical wheel movement into sideways scrolling, only while the row can still move that way,
    // so the page scrolls normally once the end is reached.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = row.scrollWidth - row.clientWidth;
      if (max <= 0 || (event.deltaY < 0 && row.scrollLeft <= 0) || (event.deltaY > 0 && row.scrollLeft >= max)) return;
      event.preventDefault();
      row.scrollLeft += event.deltaY;
    };
    update();
    row.addEventListener("scroll", update, { passive: true });
    row.addEventListener("wheel", onWheel, { passive: false });
    const observer = new ResizeObserver(update);
    observer.observe(row);
    for (const child of Array.from(row.children)) observer.observe(child);
    return () => { row.removeEventListener("scroll", update); row.removeEventListener("wheel", onWheel); observer.disconnect(); };
  }, [children]);

  const page = (direction: 1 | -1) => ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.7, behavior: "smooth" });

  return (
    <div className="relative -mx-4">
      <div ref={ref} role="group" aria-label="Nach Kategorie filtern" className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {edges.left && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center bg-gradient-to-r from-white via-white/90 to-transparent pb-1 pl-1">
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => page(-1)} className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-[#10261e]/15 bg-white text-[#10261e]/70 shadow-sm hover:text-[#10261e]">
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
      {edges.right && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent pb-1 pr-1">
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => page(1)} className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-[#10261e]/15 bg-white text-[#10261e]/70 shadow-sm hover:text-[#10261e]">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
