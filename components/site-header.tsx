import Image from "next/image";
import { Menu } from "lucide-react";
import type { Locale } from "../lib/i18n";

export function SiteHeader({ active, locale = "de" }: { active?: string; locale?: Locale }) {
  const en = locale === "en";
  const labels = en
    ? { home: "Home", menu: "Menu", gallery: "Gallery", about: "About", events: "Events", contact: "Contact", reserve: "Reserve", nav: "Open navigation", menuButton: "Menu" }
    : { home: "Start", menu: "Speisekarte", gallery: "Galerie", about: "Über uns", events: "Events", contact: "Kontakt", reserve: "Reservieren", nav: "Navigation öffnen", menuButton: "Menü" };
  const p = (path: string) => en ? (path === "/" ? "/en" : `/en${path}`) : path;
  const homeSection = (id: string) => `${p("/")}?v=8#${id}`;
  const links = [
    { href: p("/"), label: labels.home, key: "Start" },
    { href: p("/menu"), label: labels.menu, key: "Speisekarte" },
    { href: homeSection("atmosphere"), label: labels.gallery, key: "Galerie" },
    { href: homeSection("story"), label: labels.about, key: "Über uns" },
    { href: p("/events"), label: labels.events, key: "Events" },
    { href: homeSection("contact"), label: labels.contact, key: "Kontakt" },
  ];

  return <header className="relative z-50 border-b border-[#c68a3b]/25 bg-[#07110d] text-[#f5e8d3]">
    <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between px-5 sm:px-10 lg:px-16">
      <a href={p("/")} className="flex items-center gap-3" aria-label={en ? "Bailamos home" : "Bailamos Startseite"}>
        <Image src="/bailamos-logo.jpg" width={62} height={62} alt="Bailamos Logo" className="h-14 w-14 rounded-full object-cover ring-1 ring-[#c68a3b]/45" priority />
        <span className="font-display text-xl tracking-[.08em]">BAILAMOS</span>
      </a>
      <nav className="hidden items-center gap-7 text-sm lg:flex" aria-label={en ? "Main navigation" : "Hauptnavigation"}>
        {links.map(link => <a key={link.key} href={link.href} className={`nav-link ${active === link.key ? "is-active" : ""}`}>{link.label}</a>)}
      </nav>
      <div className="flex items-center gap-3">
        <a href={en ? "/" : "/en"} className="rounded-full border border-white/20 px-3 py-2 text-sm font-semibold" aria-label={en ? "Auf Deutsch wechseln" : "Switch to English"}>{en ? "EN | DE" : "DE | EN"}</a>
        <a href={p("/reservieren")} className="button-primary hidden sm:inline-flex">{labels.reserve}</a>
        <details className="group relative lg:hidden">
          <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-[#c68a3b]/45 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden" aria-label={labels.nav}>
            <Menu size={19} /><span>{labels.menuButton}</span>
          </summary>
          <nav className="absolute right-0 top-[calc(100%+.75rem)] grid w-[min(20rem,calc(100vw-2.5rem))] gap-1 rounded-2xl border border-[#c68a3b]/30 bg-[#07110d] p-3 shadow-2xl" aria-label={en ? "Mobile navigation" : "Mobile Navigation"}>
            {links.map(link => <a key={link.key} href={link.href} className={`rounded-xl px-4 py-3 text-base font-medium hover:bg-white/5 ${active === link.key ? "bg-white/10 text-[#e0b570]" : ""}`}>{link.label}</a>)}
            <a href={p("/reservieren")} className="button-primary mt-2 sm:hidden">{labels.reserve}</a>
          </nav>
        </details>
      </div>
    </div>
  </header>;
}
