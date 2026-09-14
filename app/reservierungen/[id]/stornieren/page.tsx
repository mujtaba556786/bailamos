"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "../../../../components/site-header";

export default function ManageReservation() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [state, setState] = useState<"ready" | "saving" | "cancelled" | "error">("ready");
  const [error, setError] = useState("");
  const id = params.id;
  const token = search.get("token") || "";

  async function cancel() {
    if (!window.confirm("Möchten Sie diese Reservierungsanfrage wirklich stornieren?")) return;
    setState("saving"); setError("");
    try {
      const response = await fetch("/api/reservations/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, token }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Die Stornierung konnte nicht durchgeführt werden.");
      setState("cancelled");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Verbindung wurde unterbrochen. Bitte versuchen Sie es erneut.");
      setState("error");
    }
  }

  return <main className="min-h-screen bg-[#0b1712] text-[#f5e8d3]"><SiteHeader active="Reservieren" />
    <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-24">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d6a45f] text-[#10261e]">{state === "cancelled" ? <CheckCircle2 size={36} /> : <ShieldCheck size={36} />}</span>
      <p className="eyebrow mt-8">Reservierung {id}</p>
      <h1 className="font-display mt-3 text-5xl sm:text-6xl">{state === "cancelled" ? "Ihre Anfrage ist storniert." : "Reservierung verwalten"}</h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/65">{state === "cancelled" ? "Der Tisch wurde wieder freigegeben. Die Stornierung ist abgeschlossen." : "Über diesen persönlichen Link können Sie Ihre Anfrage stornieren. Bewahren Sie ihn sicher auf."}</p>
      {state !== "cancelled" && <div className="mt-9 rounded-2xl border border-[#c68a3b]/30 bg-white/5 p-6 text-left"><strong className="text-lg">Anfrage stornieren</strong><p className="mt-2 text-sm leading-6 text-white/55">Dieser Schritt kann nicht rückgängig gemacht werden. Für eine neue Uhrzeit senden Sie anschließend eine neue Anfrage.</p>{error && <p role="alert" className="mt-5 flex gap-2 rounded-xl bg-red-950/40 p-4 text-base text-red-200"><XCircle className="mt-0.5 shrink-0" size={19} />{error}</p>}<button disabled={state === "saving" || !token} onClick={cancel} className="mt-6 min-h-14 w-full rounded-full bg-[#a52520] px-6 font-semibold text-white transition hover:bg-[#bf3029] disabled:opacity-45">{state === "saving" ? "Stornierung wird geprüft…" : "Reservierung stornieren"}</button>{!token && <p role="alert" className="mt-4 text-sm text-red-200">Dieser Link ist unvollständig. Bitte verwenden Sie den vollständig gespeicherten Verwaltungslink.</p>}</div>}
      <Link href="/" className="button-secondary mt-8">Zur Startseite</Link>
    </section>
  </main>;
}
