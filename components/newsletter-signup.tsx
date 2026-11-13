"use client";

import { useState } from "react";

// Website sign-up for events and offers. The confirmation email is sent only when the
// guest asks for it here, and the subscription counts only after they confirm.
export function NewsletterSignup({ lang = "de" }: { lang?: "de" | "en" }) {
  const L = (de: string, en: string) => (lang === "en" ? en : de);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/newsletter/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || L("Die Anmeldung konnte nicht gesendet werden.", "Sign-up could not be sent."));
      setStatus("sent");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : L("Die Anmeldung konnte nicht gesendet werden.", "Sign-up could not be sent."));
    }
  }

  if (status === "sent") {
    return <p role="status" className="text-base text-white/80">{L("Fast geschafft: Bitte bestätigen Sie die E-Mail, die wir Ihnen gerade geschickt haben.", "Almost done: please confirm the email we have just sent you.")}</p>;
  }

  return <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
    <label className="grid gap-1 text-sm text-white/75">E-Mail<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="ihre@email.de" className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-white" /></label>
    <label className="flex gap-3 text-sm text-white/70 sm:col-span-2"><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-5 w-5" /><span>{L("Ich möchte Events und Angebote von Bailamos Waldcafé per E-Mail erhalten. Abmelden kann ich mich jederzeit über den Link in jeder E-Mail. Mehr dazu in der Datenschutzerklärung.", "I would like to receive events and offers from Bailamos Waldcafé by email. I can unsubscribe at any time using the link in every email. See the privacy policy for details.")}</span></label>
    {error && <p role="alert" className="text-sm text-[#f0a09c] sm:col-span-2">{error}</p>}
    <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button disabled={status === "sending" || !consent} aria-describedby={!consent ? "newsletter-consent-hint" : undefined} className="min-h-12 rounded-full bg-[#a52520] px-6 text-sm font-semibold text-[#fff4e3] shadow-[0_10px_28px_rgba(165,37,32,.35)] transition hover:bg-[#bf3029] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c878] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10261e] disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-[#fff4e3]/40 disabled:bg-transparent disabled:text-[#fff4e3]/70 disabled:shadow-none">{status === "sending" ? L("Wird gesendet…", "Sending…") : L("Anmelden", "Subscribe")}</button>{!consent && status !== "sending" && <span id="newsletter-consent-hint" className="text-sm text-white/70">{L("Bitte zuerst die Einwilligung oben bestätigen.", "Please tick the consent box above first.")}</span>}</div>
  </form>;
}
