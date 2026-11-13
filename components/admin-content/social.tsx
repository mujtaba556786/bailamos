"use client";
// Sub-tab "Social Media": profile name and link per platform. An empty link hides the platform on the website.
import { CheckCircle2, EyeOff } from "lucide-react";
import { SOCIAL_PLATFORMS, isEmptySocialUrl, socialUrlError } from "../../lib/social-links";
import type { SectionProps } from "./types";

export function SocialSection({ content, change }: SectionProps) {
  return (
    <div>
      <p className="mb-4 text-sm text-[#10261e]/55">Die Links erscheinen auf der Startseite und auf der Eröffnungsseite. Ohne Link wird die Plattform nicht angezeigt.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {SOCIAL_PLATFORMS.map((platform) => {
          const value = content.social[platform.id];
          const empty = isEmptySocialUrl(value.url);
          const error = socialUrlError(platform.id, value.url);
          return (
            <section key={platform.id} aria-label={platform.label} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl">{platform.label}</h3>
                {empty ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#10261e]/8 px-2 py-0.5 text-xs font-semibold text-[#10261e]/60"><EyeOff size={13} />Nicht auf der Website</span>
                ) : error ? (
                  <span className="rounded-full bg-[#a52520]/10 px-2 py-0.5 text-xs font-semibold text-[#a52520]">Link prüfen</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2f6b47]/12 px-2 py-0.5 text-xs font-semibold text-[#2f6b47]"><CheckCircle2 size={13} />Sichtbar</span>
                )}
              </div>
              <label className="mt-4 grid gap-1 text-sm">
                Profil-Link
                <input
                  type="url"
                  inputMode="url"
                  placeholder={platform.example}
                  value={empty ? "" : value.url}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => change((copy) => { copy.social[platform.id].url = event.target.value.trim() || "#"; })}
                  className={`min-h-11 rounded-xl border px-3 text-base ${error ? "border-[#a52520] bg-red-50/40" : ""}`}
                />
                {error && <span role="alert" className="text-xs font-semibold text-[#a52520]">{error}</span>}
              </label>
              <label className="mt-3 grid gap-1 text-sm">
                Name auf der Website
                <input value={value.handle} maxLength={80} onChange={(event) => change((copy) => { copy.social[platform.id].handle = event.target.value; })} className="min-h-11 rounded-xl border px-3 text-base" />
              </label>
              {!empty && !error && <a href={value.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-[#a52520] underline underline-offset-2">Profil öffnen ↗</a>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
