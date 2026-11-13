"use client";
// "Mitarbeiter & Rechte": which admin areas the staff key may open. The server enforces this list on every request.
import { useId } from "react";
import { Users } from "lucide-react";
import type { OperationsConfig } from "../../lib/operations-config";
import { ADMIN_FEATURES, ADMIN_TABS, ADMIN_TAB_LABELS, type AdminTab } from "../../lib/admin-tabs";

export function StaffAccess({ config, change }: { config: OperationsConfig; change: (mutator: (copy: OperationsConfig) => void) => void }) {
  const uid = useId();
  const selected = new Set(config.booking.staffTabs ?? []);
  // Areas that are hidden for everyone (feature switch off) are left out, but a stored choice is kept.
  const tabs = ADMIN_TABS.filter((tab) => tab !== "studio" || ADMIN_FEATURES.marketingStudio);
  return (
    <section aria-labelledby={`${uid}-title`} className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-2"><Users size={19} className="text-[#b8782e]" aria-hidden="true" /><h2 id={`${uid}-title`} className="font-display text-3xl">Mitarbeiter & Rechte</h2></div>
      <fieldset className="mt-5">
        <legend className="text-sm text-[#10261e]/75">Diese Bereiche können Mitarbeiter mit dem Mitarbeiter-Schlüssel öffnen. Der Administrator sieht immer alles.</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {tabs.map((tab) => (
            <label key={tab} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#10261e]/15 px-3 text-sm hover:bg-[#f4f0e8] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#c68a3b]">
              <input
                type="checkbox"
                checked={selected.has(tab)}
                onChange={(event) => change((copy) => {
                  const current = new Set(copy.booking.staffTabs ?? []);
                  if (event.target.checked) current.add(tab as AdminTab); else current.delete(tab as AdminTab);
                  copy.booking.staffTabs = ADMIN_TABS.filter((item) => current.has(item));
                })}
                className="h-5 w-5 accent-[#10261e]"
              />
              {ADMIN_TAB_LABELS[tab]}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-4 text-xs leading-5 text-[#10261e]/65">Wird auf dem Server geprüft: Gesperrte Bereiche sind für Mitarbeiter auch über direkte Anfragen nicht erreichbar. Mitarbeiter können diese Liste nicht selbst ändern.</p>
    </section>
  );
}
