"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Loader2, Search } from "lucide-react";

type Subscriber = {
  email: string;
  name: string;
  status: "pending" | "subscribed" | "unsubscribed";
  consent_source: string;
  created_at: string;
  confirmed_at: string | null;
  updated_at: string;
};

const labels: Record<Subscriber["status"], string> = {
  subscribed: "Bestätigt",
  pending: "Noch nicht bestätigt",
  unsubscribed: "Abgemeldet",
};
const sources: Record<string, string> = { website: "Website", reservation: "Reservierung (alt)" };

function germanDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "short" }) : "–";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function AdminNewsletter({ adminKey }: { adminKey: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!adminKey) return;
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/admin/newsletter", { headers: { "x-admin-key": adminKey } })
      .then(async response => {
        const result = await response.json() as { error?: string; subscribers?: Subscriber[] };
        if (!response.ok) throw new Error(result.error || "Abonnenten konnten nicht geladen werden.");
        if (active) setSubscribers(result.subscribers || []);
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Abonnenten konnten nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false };
  }, [adminKey]);

  const counts = useMemo(() => ({
    subscribed: subscribers.filter(item => item.status === "subscribed").length,
    pending: subscribers.filter(item => item.status === "pending").length,
    unsubscribed: subscribers.filter(item => item.status === "unsubscribed").length,
  }), [subscribers]);

  const shown = useMemo(() => subscribers.filter(item =>
    (!statusFilter || item.status === statusFilter) &&
    `${item.name} ${item.email}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [subscribers, query, statusFilter]);

  // Exports the rows currently shown, so a filtered list can be downloaded too.
  function downloadCsv() {
    const header = ["Name", "E-Mail", "Status", "Quelle", "Angemeldet am", "Bestätigt am"];
    const lines = shown.map(item => [item.name, item.email, labels[item.status], sources[item.consent_source] || item.consent_source, germanDateTime(item.created_at), germanDateTime(item.confirmed_at)].map(csvCell).join(";"));
    const blob = new Blob([[header.map(csvCell).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:py-10">
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="eyebrow">E-Mail-Liste</p><h1 className="font-display mt-2 text-4xl sm:text-5xl">Newsletter</h1><p className="mt-2 text-base text-[#10261e]/55">Wer Events und Angebote erhält</p></div>
      <button onClick={downloadCsv} disabled={!shown.length} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#10261e]/15 bg-white px-4 text-sm font-semibold hover:bg-[#fff8ec] disabled:opacity-40"><Download size={17} /> Als Tabelle (CSV) speichern</button>
    </section>

    <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-3">
      {([["subscribed", "Bestätigt – erhalten Events"], ["pending", "Noch nicht bestätigt"], ["unsubscribed", "Abgemeldet"]] as const).map(([status, label]) => <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "" : status)} className={`rounded-2xl p-5 text-left shadow-sm ${statusFilter === status ? "bg-[#10261e] text-white" : "bg-white"}`}><p className="text-3xl font-semibold">{counts[status]}</p><p className={`mt-1 text-sm ${statusFilter === status ? "text-white/70" : "text-[#10261e]/50"}`}>{label}</p></button>)}
    </section>

    <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-sm">
      <div className="border-b border-[#10261e]/10 p-5"><label className="flex min-h-12 items-center gap-3 rounded-xl bg-[#f4f0e8] px-4"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Abonnenten suchen" placeholder="Name oder E-Mail" className="min-w-0 flex-1 bg-transparent text-base outline-none" /></label></div>
      {error && <p role="alert" className="flex items-center gap-2 p-5 text-red-700"><AlertCircle size={18} />{error}</p>}
      {loading ? <div className="grid min-h-72 place-items-center text-[#10261e]/50"><Loader2 className="animate-spin" size={28} /></div>
        : shown.length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#f4f0e8] text-[#10261e]/60"><tr>{["Name", "E-Mail", "Status", "Quelle", "Angemeldet", "Bestätigt"].map(head => <th key={head} scope="col" className="px-5 py-3 font-semibold">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#10261e]/10">
              {shown.map(item => <tr key={item.email} className="hover:bg-[#fff8ec]">
                <td className="px-5 py-3 font-semibold">{item.name}</td>
                <td className="px-5 py-3"><a href={`mailto:${item.email}`} className="underline-offset-4 hover:underline">{item.email}</a></td>
                <td className="px-5 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "subscribed" ? "bg-[#e3f1e6] text-[#1f6b3a]" : item.status === "pending" ? "bg-[#fff0d6] text-[#8a5a12]" : "bg-[#f1f1f1] text-[#555]"}`}>{labels[item.status]}</span></td>
                <td className="px-5 py-3">{sources[item.consent_source] || item.consent_source}</td>
                <td className="px-5 py-3">{germanDateTime(item.created_at)}</td>
                <td className="px-5 py-3">{germanDateTime(item.confirmed_at)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        : <div className="grid min-h-72 place-items-center p-8 text-center"><div><p className="font-semibold">Noch keine Abonnenten</p><p className="mt-1 text-sm text-[#10261e]/50">Sobald sich jemand über die Website anmeldet, erscheint die Person hier.</p></div></div>}
    </section>

    <p className="mt-5 text-sm leading-6 text-[#10261e]/55">Nur „Bestätigt“ erhält Events und Angebote. „Noch nicht bestätigt“ hat den Bestätigungslink noch nicht angeklickt.</p>
  </div>;
}
