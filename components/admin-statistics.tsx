"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { addDays, berlinDate } from "../lib/booking-policy";

type Row = { date: string; status: string; guest_count: number };

const lost = ["declined", "cancelled"];
const confirmed = ["confirmed", "arrived", "seated", "completed"];

function germanDate(value: string) {
  return value.split("-").reverse().join(".");
}

export function AdminStatistics({ adminKey }: { adminKey: string }) {
  const today = berlinDate();
  const [from, setFrom] = useState(addDays(today, -30));
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminKey || !from || !to || from > to) return;
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/admin/reservations?from=${from}&to=${to}`, { headers: { "x-admin-key": adminKey } })
      .then(async response => {
        const result = await response.json() as { error?: string; reservations?: Row[] };
        if (!response.ok) throw new Error(result.error || "Statistik konnte nicht geladen werden.");
        if (active) setRows(result.reservations || []);
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Statistik konnte nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false };
  }, [adminKey, from, to]);

  const days = useMemo(() => {
    const byDate = new Map<string, { bookings: number; guests: number; confirmed: number; open: number; lost: number; noShow: number }>();
    for (const row of rows) {
      const day = byDate.get(row.date) || { bookings: 0, guests: 0, confirmed: 0, open: 0, lost: 0, noShow: 0 };
      day.bookings += 1;
      if (!lost.includes(row.status)) day.guests += row.guest_count;
      if (confirmed.includes(row.status)) day.confirmed += 1;
      if (row.status === "pending") day.open += 1;
      if (lost.includes(row.status)) day.lost += 1;
      if (row.status === "no_show") day.noShow += 1;
      byDate.set(row.date, day);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const totals = days.reduce((sum, [, day]) => ({
    bookings: sum.bookings + day.bookings,
    guests: sum.guests + day.guests,
    confirmed: sum.confirmed + day.confirmed,
    open: sum.open + day.open,
    lost: sum.lost + day.lost,
    noShow: sum.noShow + day.noShow,
  }), { bookings: 0, guests: 0, confirmed: 0, open: 0, lost: 0, noShow: 0 });
  const lostShare = totals.bookings ? Math.round((totals.lost / totals.bookings) * 100) : 0;

  const presets = [
    { label: "Letzte 30 Tage", from: addDays(today, -30), to: today },
    { label: "Nächste 30 Tage", from: today, to: addDays(today, 30) },
  ];

  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:py-10">
    <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><p className="eyebrow">Auswertung</p><h1 className="font-display mt-2 text-4xl sm:text-5xl">Statistik</h1><p className="mt-2 text-base text-[#10261e]/55">{germanDate(from)} bis {germanDate(to)}</p></div>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => <button key={preset.label} onClick={() => { setFrom(preset.from); setTo(preset.to); }} className={`min-h-12 rounded-xl border px-4 text-sm font-semibold ${from === preset.from && to === preset.to ? "border-[#10261e] bg-[#10261e] text-white" : "border-[#10261e]/15 bg-white hover:bg-[#fff8ec]"}`}>{preset.label}</button>)}
        <label className="grid text-sm"><span className="sr-only">Von</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="min-h-12 rounded-xl border border-[#10261e]/15 bg-white px-4 text-base" /></label>
        <label className="grid text-sm"><span className="sr-only">Bis</span><input type="date" value={to} onChange={e => setTo(e.target.value)} className="min-h-12 rounded-xl border border-[#10261e]/15 bg-white px-4 text-base" /></label>
      </div>
    </section>

    {from > to && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">Das Enddatum muss nach dem Startdatum liegen.</p>}
    {error && <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700"><AlertCircle size={18} />{error}</p>}

    <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[[String(totals.bookings), "Buchungsanfragen"], [String(totals.guests), "Gäste (ohne Absagen)"], [String(totals.open), "Noch offen"], [`${lostShare} %`, "Storniert oder abgelehnt"]].map(([value, label]) => <div key={label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-[#10261e]/50">{label}</p></div>)}
    </section>

    <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-sm">
      {loading ? <div className="grid min-h-72 place-items-center text-[#10261e]/50"><Loader2 className="animate-spin" size={28} /></div>
        : days.length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f4f0e8] text-[#10261e]/60"><tr>{["Datum", "Anfragen", "Gäste", "Bestätigt", "Offen", "Storniert / abgelehnt", "Nicht erschienen"].map(head => <th key={head} scope="col" className="px-5 py-3 font-semibold">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#10261e]/10">
              {days.map(([date, day]) => <tr key={date} className="hover:bg-[#fff8ec]">
                <th scope="row" className="px-5 py-3 font-semibold">{germanDate(date)}</th>
                <td className="px-5 py-3">{day.bookings}</td>
                <td className="px-5 py-3">{day.guests}</td>
                <td className="px-5 py-3">{day.confirmed}</td>
                <td className="px-5 py-3">{day.open}</td>
                <td className="px-5 py-3">{day.lost}</td>
                <td className="px-5 py-3">{day.noShow}</td>
              </tr>)}
            </tbody>
            <tfoot className="bg-[#f4f0e8] font-semibold"><tr>
              <th scope="row" className="px-5 py-3">Gesamt</th>
              <td className="px-5 py-3">{totals.bookings}</td>
              <td className="px-5 py-3">{totals.guests}</td>
              <td className="px-5 py-3">{totals.confirmed}</td>
              <td className="px-5 py-3">{totals.open}</td>
              <td className="px-5 py-3">{totals.lost}</td>
              <td className="px-5 py-3">{totals.noShow}</td>
            </tr></tfoot>
          </table>
        </div>
        : <div className="grid min-h-72 place-items-center p-8 text-center"><div><p className="font-semibold">Keine Buchungen in diesem Zeitraum</p><p className="mt-1 text-sm text-[#10261e]/50">Wählen Sie oben einen anderen Zeitraum.</p></div></div>}
    </section>

    <p className="mt-5 text-sm leading-6 text-[#10261e]/55">Die Zahlen umfassen nur Buchungen, die über die Website eingegangen sind. Telefon- und WhatsApp-Buchungen werden hier noch nicht erfasst.</p>
  </div>;
}
