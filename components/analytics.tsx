"use client";

import { useEffect, useState } from "react";
import { CONSENT_KEY, GA_MEASUREMENT_ID } from "../lib/analytics";

type Consent = "granted" | "denied" | null;

// Nothing is loaded before the visitor agrees. The choice is remembered in this browser.
function readConsent(): Consent {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function saveConsent(value: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private windows can block storage; the banner simply shows again next visit.
  }
}

export function Analytics() {
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  useEffect(() => {
    if (consent !== "granted" || !GA_MEASUREMENT_ID) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    const inline = document.createElement("script");
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{anonymize_ip:true});`;
    document.head.appendChild(inline);
  }, [consent]);

  if (consent !== null || !GA_MEASUREMENT_ID) return null;

  return <div role="dialog" aria-label="Cookie-Einstellungen" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl bg-[#10261e] p-5 text-sm text-white shadow-2xl">
    <p className="leading-6">Wir messen mit Google Analytics, wie unsere Website genutzt wird. Ihre IP-Adresse wird gekürzt. Sie können Ihre Wahl jederzeit ändern. Mehr dazu in der <a href="/datenschutz" className="underline">Datenschutzerklärung</a>. / We use Google Analytics to understand how the website is used. IP addresses are shortened. See our <a href="/en/datenschutz" className="underline">privacy policy</a>.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button onClick={() => { saveConsent("granted"); setConsent("granted"); }} className="min-h-11 rounded-full bg-[#a52520] px-5 font-semibold hover:bg-[#bf3029]">Akzeptieren / Accept</button>
      <button onClick={() => { saveConsent("denied"); setConsent("denied"); }} className="min-h-11 rounded-full border border-white/30 px-5 hover:bg-white/10">Ablehnen / Decline</button>
    </div>
  </div>;
}
