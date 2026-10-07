import Link from "next/link";

export function Footer({ lang = "de" }: { lang?: "de" | "en" }) {
  const isDe = lang === "de";

  return (
    <footer className="border-t border-current border-opacity-10 px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs opacity-60">
          <nav className="flex flex-wrap items-center justify-center gap-3">
            <Link href={isDe ? "/impressum" : "/en/impressum"} className="underline hover:opacity-100">
              {isDe ? "Impressum" : "Legal Notice"}
            </Link>
            <span>·</span>
            <Link href={isDe ? "/datenschutz" : "/en/datenschutz"} className="underline hover:opacity-100">
              {isDe ? "Datenschutz" : "Privacy Policy"}
            </Link>
            <span>·</span>
            <Link href={isDe ? "/agb" : "/en/agb"} className="underline hover:opacity-100">
              {isDe ? "AGB" : "Terms & Conditions"}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
