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
  const [campaigns, setCampaigns] = useState<{ campaign_id: string; subject: string | null; recipients: number; sent_at: string }[]>([]);
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
        const result = await response.json() as { error?: string; subscribers?: Subscriber[]; campaigns?: { campaign_id: string; subject: string | null; recipients: number; sent_at: string }[] };
        if (!response.ok) throw new Error(result.error || "Abonnenten konnten nicht geladen werden.");
        if (active) { setSubscribers(result.subscribers || []); setCampaigns((result as { campaigns?: typeof campaigns }).campaigns || []); }
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

  // Event email: a test goes to one address, and a campaign goes to confirmed subscribers in batches.
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testTo, setTestTo] = useState("info@bailamos-waldcafe.de");
  const [mailStatus, setMailStatus] = useState("");
  const [mailBusy, setMailBusy] = useState(false);

  async function sendMail(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ subject, body, ...payload }),
    });
    const result = await response.json() as { error?: string; sent?: number; failed?: number; remaining?: number };
    if (!response.ok) throw new Error(result.error || "Die E-Mail konnte nicht gesendet werden.");
    return result;
  }

  async function sendTest() {
    setMailBusy(true);
    setMailStatus("Testmail wird gesendet …");
    try {
      await sendMail({ mode: "test", to: testTo });
      setMailStatus(`Testmail gesendet an ${testTo}. Bitte prüfen Sie das Postfach.`);
    } catch (cause) {
      setMailStatus(cause instanceof Error ? cause.message : "Testmail fehlgeschlagen.");
    } finally {
      setMailBusy(false);
    }
  }

  async function sendToAll() {
    const confirmed = counts.subscribed;
    if (!confirmed) return setMailStatus("Es gibt noch keine bestätigten Abonnenten.");
    if (!window.confirm(`Diese E-Mail jetzt an ${confirmed} bestätigte Abonnenten senden?`)) return;
    // A new campaign id per send, so the same text is never sent twice to the same person.
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const campaignId = "EV-" + Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    setMailBusy(true);
    let sentTotal = 0;
    try {
      for (;;) {
        const result = await sendMail({ mode: "campaign", campaignId });
        sentTotal += result.sent ?? 0;
        setMailStatus(`Gesendet: ${sentTotal} · Noch offen: ${result.remaining ?? 0}`);
        if (!result.remaining || (result.sent ?? 0) === 0) break;
      }
      setMailStatus(`Fertig. ${sentTotal} E-Mails gesendet.`);
    } catch (cause) {
      setMailStatus(`${cause instanceof Error ? cause.message : "Versand unterbrochen."} Bereits gesendet: ${sentTotal}.`);
    } finally {
      setMailBusy(false);
    }
  }

  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:py-10">
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="eyebrow">E-Mail</p><h1 className="font-display mt-2 text-4xl sm:text-5xl">E-Mail</h1><p className="mt-2 text-base text-[#10261e]/55">Abonnenten verwalten und Nachrichten senden</p></div>
      <button onClick={downloadCsv} disabled={!shown.length} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#10261e]/15 bg-white px-4 text-sm font-semibold hover:bg-[#fff8ec] disabled:opacity-40"><Download size={17} /> Als Tabelle (CSV) speichern</button>
    </section>

    <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <h2 className="font-display text-2xl">Event-E-Mail senden</h2>
      <p className="mt-1 text-sm text-[#10261e]/55">Die Nachricht geht nur an bestätigte Abonnenten. Jede E-Mail enthält einen Abmelde-Link.</p>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-1 text-sm font-semibold">Betreff<input value={subject} onChange={e => setSubject(e.target.value)} placeholder="z. B. Mezcal-Abend am 18. November" className="min-h-11 rounded-xl border border-[#10261e]/15 px-4 text-base font-normal" /></label>
        <label className="grid gap-1 text-sm font-semibold">Text (Absätze mit einer Leerzeile trennen)<textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="rounded-xl border border-[#10261e]/15 px-4 py-3 text-base font-normal" /></label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm font-semibold">Testmail an<input value={testTo} onChange={e => setTestTo(e.target.value)} type="email" className="min-h-11 rounded-xl border border-[#10261e]/15 px-4 text-base font-normal" /></label>
          <button onClick={sendTest} disabled={mailBusy || !subject.trim() || !body.trim()} className="min-h-11 rounded-full border border-[#10261e]/20 px-5 text-sm font-semibold hover:bg-[#fff8ec] disabled:opacity-40">Testmail senden</button>
          <button onClick={sendToAll} disabled={mailBusy || !subject.trim() || !body.trim()} className="min-h-11 rounded-full bg-[#a52520] px-5 text-sm font-semibold text-white hover:bg-[#bf3029] disabled:opacity-40">An alle bestätigten senden ({counts.subscribed})</button>
        </div>
        {mailStatus && <p role="status" className="text-sm text-[#10261e]/70">{mailStatus}</p>}
      </div>
    </section>

    <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-sm">
      <div className="border-b border-[#10261e]/10 p-5"><h2 className="font-display text-2xl">Gesendete E-Mails</h2><p className="mt-1 text-sm text-[#10261e]/55">Jede Aussendung mit Datum und Anzahl der Empfänger</p></div>
      {campaigns.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-[#f4f0e8] text-[#10261e]/60"><tr>{["Gesendet am", "Betreff", "Empfänger"].map(head => <th key={head} scope="col" className="px-5 py-3 font-semibold">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#10261e]/10">{campaigns.map(item => <tr key={item.campaign_id}><td className="px-5 py-3">{germanDateTime(item.sent_at)}</td><td className="px-5 py-3 font-semibold">{item.subject || "(ohne Betreff)"}</td><td className="px-5 py-3">{item.recipients}</td></tr>)}</tbody>
      </table></div>
        : <div className="p-8 text-center text-sm text-[#10261e]/50">Noch keine E-Mail gesendet.</div>}
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
