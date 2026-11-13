"use client";
// "Buchungsregeln" card in Tische & Einstellungen: time slots, group size, blocked days and a live summary.
import { useId, useState } from "react";
import { CalendarX, Plus, Settings, X } from "lucide-react";
import type { OperationsConfig } from "../../lib/operations-config";
import { berlinDate } from "../../lib/booking-policy";
import { MAX_PLACEHOLDER, addBlockedDay, blockedDayChips, bookingRuleErrors, bookingSummary, groupNoteText, removeBlockedDay } from "../../lib/booking-rules";

type Props = { config: OperationsConfig; change: (mutator: (copy: OperationsConfig) => void) => void };

const inputClass = (error?: string) =>
  `min-h-11 w-full rounded-xl border bg-[#fffaf1] px-3 text-base text-[#10261e] placeholder:text-[#10261e]/45 outline-none focus-visible:ring-2 focus-visible:ring-[#f4c878] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10261e] ${error ? "border-[#ff9d8f] ring-1 ring-[#ff9d8f]" : "border-[#f5e8d3]/40"}`;

function NumberField({ id, label, value, suffix, min, max, step, help, error, onChange }: { id: string; label: string; value: number; suffix: string; min: number; max: number; step?: number; help: string; error?: string; onChange: (value: number) => void }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#f5e8d3]">{label}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="numeric" min={min} max={max} step={step} value={Number.isFinite(value) ? value : ""} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} aria-invalid={Boolean(error)} onChange={(event) => onChange(Number(event.target.value))} className={`${inputClass(error)} pr-16`} />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#10261e]/60" aria-hidden="true">{suffix}</span>
      </div>
      <p id={`${id}-help`} className="text-xs leading-5 text-[#f5e8d3]/80">{help}</p>
      {error && <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-[#ffb3a8]">{error}</p>}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#f5e8d3]/15 pt-6 first:border-t-0 first:pt-0">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-[#f4c878]">{title}</h3>
      {children}
    </section>
  );
}

export function BookingRules({ config, change }: Props) {
  const uid = useId();
  const reservation = config.restaurant.reservation;
  const reasons = reservation.blockedReasons ?? {};
  const [noteLang, setNoteLang] = useState<"de" | "en">("de");
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [dateError, setDateError] = useState("");
  const [showPast, setShowPast] = useState(false);
  const today = berlinDate();

  const errors = bookingRuleErrors(reservation);
  const online = Math.min(reservation.maximumGuests, reservation.guestSelectLimit);
  const chips = blockedDayChips(reservation.blockedDates ?? [], reasons, today, showPast);
  const summary = bookingSummary({ openingHours: config.restaurant.openingHours, rules: reservation, horizonDays: config.booking.horizonDays, blockedDates: reservation.blockedDates ?? [], today });
  const setReservation = (mutate: (r: OperationsConfig["restaurant"]["reservation"]) => void) => change((copy) => mutate(copy.restaurant.reservation));
  const slotExample = (() => {
    const start = 12 * 60, step = reservation.intervalMinutes > 0 ? reservation.intervalMinutes : 30;
    return [0, 1, 2].map((n) => { const m = start + n * step; return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }).join(", ");
  })();

  function addDay() {
    const result = addBlockedDay(reservation.blockedDates ?? [], reasons, newDate, newReason);
    if (result.error) { setDateError(result.error); return; }
    setDateError("");
    setReservation((r) => { r.blockedDates = result.dates; r.blockedReasons = result.reasons; });
    setNewDate(""); setNewReason("");
  }

  return (
    <section aria-labelledby={`${uid}-title`} className="rounded-[2rem] bg-[#10261e] p-5 text-[#f5e8d3] shadow-sm sm:p-7">
      <div className="flex items-center gap-2"><Settings size={19} className="text-[#f4c878]" aria-hidden="true" /><h2 id={`${uid}-title`} className="font-display text-3xl">Buchungsregeln</h2></div>
      <div className="mt-6 grid gap-6">
        <SubSection title="Zeitfenster">
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField id={`${uid}-duration`} label="Dauer" suffix="Min." min={30} max={360} step={15} value={reservation.durationMinutes} help="So lange ist ein Tisch pro Reservierung belegt" error={errors.durationMinutes} onChange={(value) => setReservation((r) => { r.durationMinutes = value; })} />
            <NumberField id={`${uid}-interval`} label="Intervall" suffix="Min." min={15} max={120} step={15} value={reservation.intervalMinutes} help={`Neue Startzeit alle ${reservation.intervalMinutes || "–"} Min. (z. B. ${slotExample})`} onChange={(value) => setReservation((r) => { r.intervalMinutes = value; })} />
            <NumberField id={`${uid}-lead`} label="Vorlauf" suffix="Min." min={0} max={1440} value={config.booking.leadMinutes} help={`Gäste können frühestens ${config.booking.leadMinutes} Min. vor Ankunft buchen`} onChange={(value) => change((copy) => { copy.booking.leadMinutes = value; })} />
            <NumberField id={`${uid}-horizon`} label="Buchbar im Voraus" suffix="Tage" min={1} max={730} value={config.booking.horizonDays} help="Wie viele Tage im Voraus online gebucht werden kann" onChange={(value) => change((copy) => { copy.booking.horizonDays = value; })} />
          </div>
        </SubSection>

        <SubSection title="Gruppengröße">
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField id={`${uid}-max`} label="Max. Gäste pro Reservierung" suffix="Gäste" min={1} max={50} value={reservation.maximumGuests} help="Obergrenze für eine einzelne Reservierung. Größere Anfragen lehnt das System ab." onChange={(value) => setReservation((r) => { r.maximumGuests = value; })} />
            <NumberField id={`${uid}-form`} label="Größte Gruppe im Online-Formular" suffix="Gäste" min={1} max={20} value={reservation.guestSelectLimit} help={`Bis zu dieser Zahl buchen Gäste selbst. Darüber sehen sie den Hinweis unten. Online buchbar: bis ${online}.`} error={errors.guestSelectLimit} onChange={(value) => setReservation((r) => { r.guestSelectLimit = value; })} />
          </div>
          <div className="mt-5 grid gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={`${uid}-note`} className="text-sm font-semibold text-[#f5e8d3]">Hinweis bei großen Gruppen</label>
              <div role="tablist" aria-label="Sprache des Hinweises" className="flex rounded-full border border-[#f5e8d3]/30 p-0.5">
                {(["de", "en"] as const).map((lang) => {
                  const empty = !reservation.largeGroupNote[lang].trim();
                  return (
                    <button key={lang} type="button" role="tab" aria-selected={noteLang === lang} aria-controls={`${uid}-note`} onClick={() => setNoteLang(lang)} className={`relative min-h-9 rounded-full px-3 text-sm font-semibold ${noteLang === lang ? "bg-[#f5e8d3] text-[#10261e]" : "text-[#f5e8d3]/85 hover:text-[#f5e8d3]"}`}>
                      {lang.toUpperCase()}
                      {empty && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#ff9d8f]" aria-label="leer" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <textarea id={`${uid}-note`} role="tabpanel" rows={3} maxLength={400} value={reservation.largeGroupNote[noteLang]} aria-describedby={`${uid}-note-help`} onChange={(event) => setReservation((r) => { r.largeGroupNote[noteLang] = event.target.value; })} className={`${inputClass()} py-2`} />
            <p id={`${uid}-note-help`} className="text-xs leading-5 text-[#f5e8d3]/80"><code className="rounded bg-[#f5e8d3]/15 px-1">{MAX_PLACEHOLDER}</code> wird automatisch ersetzt (aktuell: {online}). Gäste sehen: „{groupNoteText(reservation.largeGroupNote[noteLang] || "…", online)}“</p>
          </div>
        </SubSection>

        <SubSection title="Gesperrte Tage">
          <p className="mb-3 text-xs leading-5 text-[#f5e8d3]/80">An diesen Tagen sind keine Online-Reservierungen möglich.</p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] sm:items-end">
            <div className="grid gap-1.5">
              <label htmlFor={`${uid}-date`} className="text-sm font-semibold">Datum</label>
              <input id={`${uid}-date`} type="date" min={today} value={newDate} onChange={(event) => { setNewDate(event.target.value); setDateError(""); }} aria-invalid={Boolean(dateError)} className={inputClass(dateError)} />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor={`${uid}-reason`} className="text-sm font-semibold">Grund <span className="font-normal text-[#f5e8d3]/80">(optional)</span></label>
              <input id={`${uid}-reason`} value={newReason} maxLength={60} placeholder="z. B. Silvester" onChange={(event) => setNewReason(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDay(); } }} className={inputClass()} />
            </div>
            <button type="button" onClick={addDay} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f4c878] px-4 text-sm font-semibold text-[#10261e] hover:bg-[#f8d79a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fffaf1]"><Plus size={16} />Hinzufügen</button>
          </div>
          {dateError && <p role="alert" className="mt-2 text-xs font-semibold text-[#ffb3a8]">{dateError}</p>}
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Gesperrte Tage">
            {chips.visible.map((chip) => (
              <li key={chip.date} className={`inline-flex min-h-9 items-center gap-1 rounded-full pl-3 text-sm ${chip.past ? "bg-[#f5e8d3]/10 text-[#f5e8d3]/70" : "bg-[#f5e8d3]/20 text-[#fffaf1]"}`}>
                <CalendarX size={14} aria-hidden="true" />{chip.label}
                <button type="button" aria-label={`${chip.label} entfernen`} onClick={() => setReservation((r) => { const next = removeBlockedDay(r.blockedDates ?? [], r.blockedReasons ?? {}, chip.date); r.blockedDates = next.dates; r.blockedReasons = next.reasons; })} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f5e8d3]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c878]"><X size={14} /></button>
              </li>
            ))}
            {chips.visible.length === 0 && <li className="text-sm text-[#f5e8d3]/80">Keine kommenden gesperrten Tage.</li>}
          </ul>
          {chips.pastCount > 0 && (
            <label className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm text-[#f5e8d3]/90">
              <input type="checkbox" checked={showPast} onChange={(event) => setShowPast(event.target.checked)} className="h-4 w-4 accent-[#f4c878]" />Vergangene anzeigen ({chips.pastCount})
            </label>
          )}
        </SubSection>

        <div role="status" aria-live="polite" className="rounded-2xl bg-[#f5e8d3]/10 p-4 text-sm leading-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-[#f4c878]">Vorschau für Gäste</p>
          {summary}
        </div>
      </div>
    </section>
  );
}
