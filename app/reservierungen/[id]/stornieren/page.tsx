"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "../../../../components/site-header";
import { withLocale,type Locale } from "../../../../lib/i18n";

export function ManageReservationExperience({locale}:{locale:Locale}) {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [state, setState] = useState<"ready" | "saving" | "cancelled" | "error">("ready");
  const [error, setError] = useState("");
  const id = params.id;
  const token = search.get("token") || "";
  const L=(de:string,en:string)=>locale==="en"?en:de;

  async function cancel() {
    if (!window.confirm(L("Möchten Sie diese Reservierungsanfrage wirklich stornieren?","Do you really want to cancel this reservation request?"))) return;
    setState("saving"); setError("");
    try {
      const response = await fetch("/api/reservations/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, token }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || L("Die Stornierung konnte nicht durchgeführt werden.","The reservation could not be cancelled."));
      setState("cancelled");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L("Die Verbindung wurde unterbrochen. Bitte versuchen Sie es erneut.","The connection was interrupted. Please try again."));
      setState("error");
    }
  }

  return <main className="min-h-screen bg-[#0b1712] text-[#f5e8d3]"><SiteHeader active="Reservieren" />
    <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-24">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d6a45f] text-[#10261e]">{state === "cancelled" ? <CheckCircle2 size={36} /> : <ShieldCheck size={36} />}</span>
      <p className="eyebrow mt-8">{L("Reservierung","Reservation")} {id}</p>
      <h1 className="font-display mt-3 text-5xl sm:text-6xl">{state === "cancelled" ? L("Ihre Anfrage ist storniert.","Your request is cancelled.") : L("Reservierung verwalten","Manage reservation")}</h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/65">{state === "cancelled" ? L("Der Tisch wurde wieder freigegeben. Die Stornierung ist abgeschlossen.","The table has been released and the cancellation is complete.") : L("Über diesen persönlichen Link können Sie Ihre Anfrage stornieren. Bewahren Sie ihn sicher auf.","Use this personal link to cancel your request. Keep it safe.")}</p>
      {state !== "cancelled" && <div className="mt-9 rounded-2xl border border-[#c68a3b]/30 bg-white/5 p-6 text-left"><strong className="text-lg">{L("Anfrage stornieren","Cancel request")}</strong><p className="mt-2 text-sm leading-6 text-white/55">{L("Dieser Schritt kann nicht rückgängig gemacht werden. Für eine neue Uhrzeit senden Sie anschließend eine neue Anfrage.","This cannot be undone. Submit a new request if you need another time.")}</p>{error && <p role="alert" className="mt-5 flex gap-2 rounded-xl bg-red-950/40 p-4 text-base text-red-200"><XCircle className="mt-0.5 shrink-0" size={19} />{error}</p>}<button disabled={state === "saving" || !token} onClick={cancel} className="mt-6 min-h-14 w-full rounded-full bg-[#a52520] px-6 font-semibold text-white transition hover:bg-[#bf3029] disabled:opacity-45">{state === "saving" ? L("Stornierung wird geprüft…","Cancelling…") : L("Reservierung stornieren","Cancel reservation")}</button>{!token && <p role="alert" className="mt-4 text-sm text-red-200">{L("Dieser Link ist unvollständig. Bitte verwenden Sie den vollständig gespeicherten Verwaltungslink.","This link is incomplete. Please use the full saved management link.")}</p>}</div>}
      <Link href={withLocale("/",locale)} className="button-secondary mt-8">{L("Zur Startseite","Back to home")}</Link>
    </section>
  </main>;
}
export default function ManageReservation(){return <ManageReservationExperience locale="de"/>}
