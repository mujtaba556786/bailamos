export function Footer({ lang = "de" }: { lang?: "de" | "en" }) {
  const isDe = lang === "de";
  const tagline = isDe ? "Authentisch · Leidenschaftlich · Mexikanisch" : "Authentic · Passionate · Mexican";

  return (
    <footer className="bg-[#09130f] px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="border-t border-[#c68a3b]/25 pt-8">
          {/* Legal Links */}
          <nav className="mb-6 flex flex-wrap items-center justify-center gap-4">
            <a href={isDe ? "/impressum" : "/en/impressum"} className="text-xs text-white/70 underline hover:text-[#efc67e] transition-colors">
              {isDe ? "Impressum" : "Legal Notice"}
            </a>
            <span className="text-white/30">·</span>
            <a href={isDe ? "/datenschutz" : "/en/datenschutz"} className="text-xs text-white/70 underline hover:text-[#efc67e] transition-colors">
              {isDe ? "Datenschutz" : "Privacy Policy"}
            </a>
            <span className="text-white/30">·</span>
            <a href={isDe ? "/agb" : "/en/agb"} className="text-xs text-white/70 underline hover:text-[#efc67e] transition-colors">
              {isDe ? "AGB" : "Terms & Conditions"}
            </a>
          </nav>

          {/* Copyright + Tagline */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/40">
            <span>© 2026 Bailamos Waldcafé</span>
            <span>·</span>
            <span>{tagline}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
