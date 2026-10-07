export function Footer({ lang = "de" }: { lang?: "de" | "en" }) {
  const isDe = lang === "de";
  const tagline = isDe ? "Authentisch · Leidenschaftlich · Mexikanisch" : "Authentic · Passionate · Mexican";

  return (
    <footer className="border-t border-current border-opacity-10 px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-4 text-xs opacity-60">
          {/* Copyright + Tagline */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>© 2026 Bailamos Waldcafé</span>
            <span>·</span>
            <span>{tagline}</span>
          </div>

          {/* Legal Links */}
          <nav className="flex flex-wrap items-center justify-center gap-3">
            <a href={isDe ? "/impressum" : "/en/impressum"} className="underline hover:opacity-100">
              {isDe ? "Impressum" : "Legal Notice"}
            </a>
            <span>·</span>
            <a href={isDe ? "/datenschutz" : "/en/datenschutz"} className="underline hover:opacity-100">
              {isDe ? "Datenschutz" : "Privacy Policy"}
            </a>
            <span>·</span>
            <a href={isDe ? "/agb" : "/en/agb"} className="underline hover:opacity-100">
              {isDe ? "AGB" : "Terms & Conditions"}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
