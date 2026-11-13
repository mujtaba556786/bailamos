"use client";
import { useEffect, useState } from "react";
import { CalendarX, Loader2, Plus, Trash2 } from "lucide-react";

type Config = { restaurant: { reservation: { blockedDates: string[] } } } & Record<string, any>;

// Close a whole day for online booking, or open it again. Saves the same operations settings as "Tische & Einstellungen".
export function AdminClosedDays({ adminKey }: { adminKey: string }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [version, setVersion] = useState(0);
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function request(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, { ...options, headers: { ...options.headers, "x-admin-key": adminKey } });
    const result = (await response.json()) as any;
    if (!response.ok) throw new Error(result.error || "Änderung fehlgeschlagen.");
    return result;
  }

  async function load() {
    try {
      const result = await request("/api/admin/closed-days");
      setConfig({ restaurant: { reservation: { blockedDates: result.blockedDates } } } as Config);
      setVersion(result.version);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Einstellungen konnten nicht geladen werden.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function save(next: string[]) {
    if (!config) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request("/api/admin/closed-days", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ blockedDates: next, version }) });
      setConfig({ restaurant: { reservation: { blockedDates: result.blockedDates } } } as Config);
      setVersion(result.version);
      setNotice("Gespeichert. Online-Buchungen sind an den gesperrten Tagen geschlossen.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  const blocked = [...(config?.restaurant.reservation.blockedDates ?? [])].sort();

  // Expands a start and end date into single days (inclusive), at most 90 days at once.
  function addDays() {
    const start = date, end = endDate || date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) { setError("Bitte ein Datum wählen."); return; }
    if (end < start) { setError("Das Enddatum liegt vor dem Startdatum."); return; }
    const days: string[] = [];
    for (let d = new Date(`${start}T12:00:00Z`); d.toISOString().slice(0, 10) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      if (days.length >= 90) { setError("Bitte höchstens 90 Tage auf einmal sperren."); return; }
      days.push(d.toISOString().slice(0, 10));
    }
    const fresh = days.filter((day) => !blocked.includes(day));
    if (!fresh.length) { setError("Diese Tage sind bereits gesperrt."); return; }
    void save([...blocked, ...fresh]);
    setDate("");
    setEndDate("");
  }

  function label(day: string) {
    return new Date(`${day}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
  }

  return (
    <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-2"><CalendarX size={19} className="text-[#a52520]" /><h2 className="font-display text-3xl">Online-Buchungen sperren</h2></div>
      <p className="mt-2 text-sm text-[#10261e]/60">Gesperrte Tage können online nicht gebucht werden. Bestehende Reservierungen bleiben bestehen.</p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">Von
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 rounded-xl border px-3 text-base" />
        </label>
        <label className="grid gap-1 text-sm">Bis (optional)
          <input type="date" value={endDate} min={date || undefined} onChange={(e) => setEndDate(e.target.value)} className="min-h-11 rounded-xl border px-3 text-base" />
        </label>
        <button onClick={addDays} disabled={busy || !config || !date} className="button-primary disabled:opacity-45">
          {busy ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} {endDate && endDate !== date ? "Zeitraum sperren" : "Tag sperren"}
        </button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <ul className="mt-5 grid gap-2">
        {!config && <li className="text-sm text-[#10261e]/50">Wird geladen…</li>}
        {config && blocked.length === 0 && <li className="text-sm text-[#10261e]/50">Keine Tage gesperrt. Online ist alles buchbar.</li>}
        {blocked.map((day) => (
          <li key={day} className="flex items-center justify-between gap-3 rounded-xl border border-[#10261e]/10 px-4 py-3">
            <span><strong>{label(day)}</strong> <span className="text-xs text-[#10261e]/50">{day}</span></span>
            <button onClick={() => void save(blocked.filter((x) => x !== day))} disabled={busy} aria-label={`${day} wieder öffnen`} className="text-[#a52520] disabled:opacity-45"><Trash2 size={17} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}
