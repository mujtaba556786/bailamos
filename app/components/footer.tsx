import Link from "next/link";

export function Footer({ lang = "de" }: { lang?: "de" | "en" }) {
  const isDe = lang === "de";

  return (
    <footer className="border-t border-gray-300 bg-gray-50 px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <span>© 2026 Bailamos Waldcafé</span>
          <nav className="flex flex-wrap gap-4">
            <Link href={isDe ? "/impressum" : "/en/impressum"} className="hover:text-gray-900">
              {isDe ? "Impressum" : "Legal Notice"}
            </Link>
            <span className="text-gray-400">·</span>
            <Link href={isDe ? "/datenschutz" : "/en/datenschutz"} className="hover:text-gray-900">
              {isDe ? "Datenschutz" : "Privacy Policy"}
            </Link>
            <span className="text-gray-400">·</span>
            <Link href={isDe ? "/agb" : "/en/agb"} className="hover:text-gray-900">
              {isDe ? "AGB" : "Terms & Conditions"}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
