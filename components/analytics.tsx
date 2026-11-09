"use client";

import { useEffect, useState } from "react";
import { CONSENT_KEY, GA_MEASUREMENT_ID, GTM_CONTAINER_ID } from "../lib/analytics";

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
  const trackingOn = Boolean(GA_MEASUREMENT_ID || GTM_CONTAINER_ID);

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  useEffect(() => {
    if (consent !== "granted" || !trackingOn) return;
    window.dataLayer = window.dataLayer || [];
    if (GTM_CONTAINER_ID) {
      // Tag Manager container. Tags inside it run only after this consent.
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const gtm = document.createElement("script");
      gtm.async = true;
      gtm.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
      document.head.appendChild(gtm);
    }
    if (GA_MEASUREMENT_ID) {
      const ga = document.createElement("script");
      ga.async = true;
      ga.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(ga);
      const inline = document.createElement("script");
      inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{anonymize_ip:true});`;
      document.head.appendChild(inline);
    }
  }, [consent, trackingOn]);

  if (consent !== null || !trackingOn) return null;

  return <div role="dialog" aria-label="Cookie-Einstellungen" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl bg-[#10261e] p-5 text-sm text-white shadow-2xl">
    <p className="leading-6">Wir messen mit Google, wie unsere Website genutzt wird. Ihre IP-Adresse wird gekürzt. Sie können Ihre Wahl jederzeit ändern. Mehr dazu in der <a href="/datenschutz" className="underline">Datenschutzerklärung</a>. / We use Google to understand how the website is used. IP addresses are shortened. See our <a href="/en/datenschutz" className="underline">privacy policy</a>.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button onClick={() => { saveConsent("granted"); setConsent("granted"); }} className="min-h-11 rounded-full bg-[#a52520] px-5 font-semibold hover:bg-[#bf3029]">Akzeptieren / Accept</button>
      <button onClick={() => { saveConsent("denied"); setConsent("denied"); }} className="min-h-11 rounded-full border border-white/30 px-5 hover:bg-white/10">Ablehnen / Decline</button>
    </div>
  </div>;
}
