"use client";
// Banner at the top of every admin tab: is the public site locked behind the opening screen or live?
// Locking and releasing always go through a confirmation dialog and change only the lock, nothing else.
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { AdminConfirmDialog } from "./admin-confirm-dialog";

export type SiteStatus = { locked: boolean; enabled: boolean; autoReveal: boolean; openingDate: string; revealDate: string; canEdit: boolean };
export type SiteLockResult = Omit<SiteStatus, "canEdit"> & { version: number; previousVersion: number };

// Events used between the banner and the Website-Inhalte tab.
export const SITE_LOCK_REQUEST = "bailamos:request-site-lock";
export const SITE_LOCK_CHANGED = "bailamos:site-lock-changed";
export const CONTENT_PUBLISHED = "bailamos:content-published";

export function formatGermanDate(date: string) {
  if (!date) return "";
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
}

export function AdminSiteStatus({ adminKey }: { adminKey: string }) {
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [confirm, setConfirm] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Loads the status now, after every publish in Website-Inhalte, and opens the dialog when another part asks.
  useEffect(() => {
    let alive = true;
    const fetchStatus = () => {
      fetch("/api/admin/site-status", { headers: { "x-admin-key": adminKey } })
        .then((response) => (response.ok ? (response.json() as Promise<SiteStatus>) : null))
        .then((result) => { if (alive && result) setStatus(result); })
        .catch(() => { /* the banner simply stays hidden */ });
    };
    const request = (event: Event) => setConfirm((event as CustomEvent<{ enabled: boolean }>).detail.enabled);
    fetchStatus();
    window.addEventListener(CONTENT_PUBLISHED, fetchStatus);
    window.addEventListener(SITE_LOCK_REQUEST, request);
    return () => { alive = false; window.removeEventListener(CONTENT_PUBLISHED, fetchStatus); window.removeEventListener(SITE_LOCK_REQUEST, request); };
  }, [adminKey]);

  async function apply() {
    if (confirm === null) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/site-status", { method: "PATCH", headers: { "x-admin-key": adminKey, "content-type": "application/json" }, body: JSON.stringify({ enabled: confirm }) });
      const result = (await response.json()) as SiteLockResult & { error?: string };
      if (!response.ok) throw new Error(result.error || "Änderung fehlgeschlagen.");
      setStatus((current) => ({ ...result, canEdit: current?.canEdit ?? true }));
      window.dispatchEvent(new CustomEvent(SITE_LOCK_CHANGED, { detail: result }));
      setConfirm(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Änderung fehlgeschlagen.");
      setConfirm(null);
    } finally { setBusy(false); }
  }

  if (!status) return null;
  const autoOpen = status.locked && status.autoReveal && status.revealDate;
  const releaseNow = confirm === false;
  // Locking with automatic release still on would lock only until the release day.
  const lockUntil = confirm === true && status.autoReveal && status.revealDate ? formatGermanDate(status.revealDate) : "";

  return (
    <>
      {status.locked ? (
        <div role="status" className="border-b border-[#a52520]/20 bg-[#a52520] px-4 py-2.5 text-white sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Lock size={16} className="shrink-0" />
              {autoOpen ? `Website gesperrt – öffnet automatisch am ${formatGermanDate(status.revealDate)}` : "Website gesperrt – Gäste sehen nur die Eröffnungsseite"}
            </p>
            {status.canEdit && (
              <button type="button" onClick={() => setConfirm(false)} className="min-h-9 rounded-full bg-white px-4 text-sm font-semibold text-[#a52520] hover:bg-[#fff1ee]">Jetzt freigeben</button>
            )}
          </div>
        </div>
      ) : (
        <div role="status" className="border-b border-[#10261e]/10 bg-white px-4 py-1.5 sm:px-8">
          <p className="mx-auto flex max-w-7xl items-center gap-2 text-xs font-semibold text-[#2f6b47]">
            <span className="h-2 w-2 rounded-full bg-[#2f9b5f]" aria-hidden="true" /> Website ist live
          </p>
        </div>
      )}
      {error && <p role="alert" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</p>}
      <AdminConfirmDialog
        open={confirm !== null}
        title={releaseNow ? "Website jetzt freigeben?" : "Website sperren?"}
        confirmLabel={releaseNow ? "Jetzt freigeben" : "Website sperren"}
        danger={!releaseNow}
        busy={busy}
        onConfirm={apply}
        onCancel={() => setConfirm(null)}
      >
        {releaseNow ? (
          <p>Gäste sehen sofort die ganze Website statt der Eröffnungsseite. Andere ungespeicherte Änderungen werden dabei nicht veröffentlicht.</p>
        ) : (
          <p>
            Gäste sehen danach nur noch die Eröffnungsseite. Admin und Stornierungslinks bleiben erreichbar.
            {lockUntil && <> Wegen der automatischen Freigabe öffnet die Website wieder am {lockUntil}.</>}
          </p>
        )}
      </AdminConfirmDialog>
    </>
  );
}
