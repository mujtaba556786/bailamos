"use client";
// Speisekarte admin. Holds the menu state and talks to the API; the panes live in components/admin-menu/.
import { useEffect, useState } from "react";
import { Languages, Loader2, Save, UtensilsCrossed } from "lucide-react";
import type { MenuContent } from "../lib/menu-content";
import { moveItem } from "../lib/menu-admin";
import { AdminMenuImport } from "./admin-menu-import";
import { CategoryManager } from "./admin-menu/category-manager";
import { DishEditor } from "./admin-menu/dish-editor";
import { DishList } from "./admin-menu/dish-list";

// True from the lg breakpoint (1024px) up, where list and editor sit side by side.
function useDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function AdminMenu({ adminKey }: { adminKey: string }) {
  const [menu, setMenu] = useState<MenuContent | null>(null);
  const [saved, setSaved] = useState<MenuContent | null>(null);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const desktop = useDesktop();
  const mobileEditor = !desktop && editorOpen;

  // Stop the page behind the full-screen editor from scrolling on phones.
  useEffect(() => {
    if (!mobileEditor) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobileEditor]);

  async function request(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, { ...options, headers: { ...options.headers, "x-admin-key": adminKey } });
    const result = (await response.json()) as any;
    if (!response.ok) throw new Error(result.error || "Änderung fehlgeschlagen.");
    return result;
  }

  async function load() {
    setLoading(true); setError("");
    try {
      const result = await request("/api/admin/menu");
      setMenu(result.content); setSaved(result.content); setVersion(result.version);
      setSelected(result.content.dishes[0]?.id || "");
      setAiConfigured(result.aiConfigured === true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Speisekarte konnte nicht geladen werden.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function change(mutator: (copy: MenuContent) => void) {
    if (!menu) return;
    const copy = structuredClone(menu);
    mutator(copy);
    setMenu(copy); setNotice("");
  }

  async function save() {
    if (!menu) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await request("/api/admin/menu", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: menu, version }) });
      setMenu(result.content); setSaved(result.content); setVersion(result.version);
      setNotice("Speisekarte veröffentlicht.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Speisekarte konnte nicht gespeichert werden.");
    } finally { setSaving(false); }
  }

  async function generateEnglish() {
    if (!menu) return;
    setTranslating(true); setError("");
    try {
      const texts = [...menu.categories.map((x) => x.name.de), ...menu.dishes.flatMap((x) => [x.name.de, x.description.de])];
      const result = await request("/api/admin/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts }) });
      let cursor = 0;
      change((copy) => {
        for (const category of copy.categories) category.name.en = result.translations[cursor++];
        for (const dish of copy.dishes) { dish.name.en = result.translations[cursor++]; dish.description.en = result.translations[cursor++]; }
      });
      setLanguage("en");
      setNotice("Englischer Entwurf erstellt. Bitte prüfen und veröffentlichen.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Übersetzung fehlgeschlagen.");
    } finally { setTranslating(false); }
  }

  async function uploadMedia(file: File) {
    const result = await request("/api/admin/media", { method: "POST", headers: { "content-type": file.type }, body: file });
    if (result.kind !== "image") throw new Error("Bitte ein Bild auswählen.");
    return result.url as string;
  }

  async function upload(file: File) {
    if (!dish) return;
    setUploading(true); setError("");
    try {
      const url = await uploadMedia(file);
      change((copy) => { const item = copy.dishes.find((value) => value.id === selected); if (item) item.image = url; });
      setNotice("Foto hochgeladen. Bitte Speisekarte veröffentlichen.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload fehlgeschlagen.");
    } finally { setUploading(false); }
  }

  async function uploadCategoryImage(index: number, file: File) {
    setError("");
    try {
      const url = await uploadMedia(file);
      change((copy) => { copy.categories[index].image = url; });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bild konnte nicht hochgeladen werden.");
    }
  }

  const dish = menu?.dishes.find((item) => item.id === selected);
  if (loading) return <div className="grid min-h-[480px] place-items-center"><Loader2 className="animate-spin text-[#b8782e]" size={32} /></div>;
  if (!menu) return <div className="p-10 text-center"><p>{error}</p><button onClick={load} className="mt-4 text-[#a52520] underline">Erneut versuchen</button></div>;

  function selectDish(id: string) { setSelected(id); setEditorOpen(true); }

  function addDish() {
    const categoryId = menu!.categories[0].id, id = `gericht-${Date.now()}`;
    change((copy) => copy.dishes.unshift({ id, categoryId, name: { de: "Neues Gericht", en: "New dish" }, description: { de: "Beschreibung ergänzen", en: "Add description" }, price: 0, image: "/table-corner.webp", featured: false, available: false, vegetarian: false, spicy: 0, allergens: [] }));
    selectDish(id);
  }

  function deleteDish() {
    if (!dish) return;
    change((copy) => { const index = copy.dishes.findIndex((item) => item.id === dish.id); copy.dishes.splice(index, 1); });
    setSelected(""); setEditorOpen(false);
  }

  function addCategory() {
    const id = `kategorie-${Date.now()}`;
    change((copy) => copy.categories.push({ id, name: { de: "Neue Kategorie", en: "New category" } }));
  }

  function moveCategory(from: number, to: number) {
    change((copy) => { copy.categories = moveItem(copy.categories, from, to); });
  }

  function removeCategory(id: string) {
    change((copy) => { copy.categories = copy.categories.filter((item) => item.id !== id); });
  }

  function applyImportedMenu(next: MenuContent) {
    setMenu(next); setSelected(next.dishes[0]?.id || ""); setError("");
    setNotice("Excel-Import wurde in den Entwurf übernommen. Bitte prüfen und anschließend beide Sprachen veröffentlichen.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:py-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Website verwalten</p>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl">Speisekarte</h1>
          <p className="mt-2 text-base text-[#10261e]/55">Deutsch pflegen, Englisch prüfen und beide Sprachen gemeinsam veröffentlichen.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-full border bg-white p-1">
            {(["de", "en"] as const).map((code) => (
              <button key={code} onClick={() => setLanguage(code)} aria-pressed={language === code} className={`rounded-full px-4 py-2 text-sm font-semibold ${language === code ? "bg-[#10261e] text-white" : ""}`}>{code.toUpperCase()}</button>
            ))}
          </div>
          <button disabled={translating || !aiConfigured} onClick={generateEnglish} className="button-secondary disabled:opacity-45" title={aiConfigured ? "" : "OPENAI_API_KEY noch nicht eingerichtet"}>
            {translating ? <Loader2 className="animate-spin" size={18} /> : <Languages size={18} />}Englisch generieren
          </button>
          <button disabled={saving} onClick={save} className="button-primary">
            <Save size={18} />{saving ? "Wird veröffentlicht…" : "Beide Sprachen veröffentlichen"}
          </button>
        </div>
      </div>

      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-xl p-4 ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}

      <AdminMenuImport adminKey={adminKey} menu={menu} onApply={applyImportedMenu} />

      <CategoryManager menu={menu} saved={saved} language={language} change={change} onAdd={addCategory} onMove={moveCategory} onDelete={removeCategory} onUploadImage={uploadCategoryImage} />

      <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-sm lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:overflow-visible">
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-hidden lg:rounded-l-[2rem] lg:border-r lg:border-[#10261e]/10">
          <DishList menu={menu} language={language} selected={editorOpen || desktop ? selected : ""} onSelect={selectDish} onAdd={addDish} />
        </div>
        <div
          role={mobileEditor ? "dialog" : undefined}
          aria-modal={mobileEditor ? true : undefined}
          aria-label={mobileEditor && dish ? `${dish.name.de} bearbeiten` : undefined}
          inert={!desktop && !editorOpen}
          className={`min-w-0 max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:bg-white max-lg:transition-transform max-lg:duration-300 ${editorOpen ? "max-lg:translate-x-0" : "max-lg:pointer-events-none max-lg:translate-x-full"}`}
        >
          {!dish ? (
            <div className="grid min-h-[560px] place-items-center p-8 text-center">
              <div><UtensilsCrossed className="mx-auto text-[#c68a3b]" size={34} /><p className="mt-4">Gericht auswählen oder hinzufügen.</p></div>
            </div>
          ) : (
            <DishEditor menu={menu} dish={dish} language={language} uploading={uploading} change={change} setSelected={setSelected} upload={upload} onDelete={deleteDish} onBack={() => setEditorOpen(false)} />
          )}
        </div>
      </section>
    </div>
  );
}
