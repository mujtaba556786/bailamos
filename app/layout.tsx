import type { Metadata } from "next";
import { getSiteUrl } from "../lib/site-url";
import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getSeoContent } from "../lib/seo-content.ts";
import { brandTitle, BRAND_SUFFIX } from "../lib/page-title";
import "./globals.css";
import { Analytics } from "../components/analytics";

export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB);return {
  metadataBase: getSiteUrl(),
  // Plain string titles ("Impressum") get the brand added once; pages with SEO titles pass { absolute: brandTitle(...) }.
  title: { default: brandTitle(content.pages.home.title.de), template: `%s${BRAND_SUFFIX}` },
  description: content.pages.home.description.de,
  keywords: content.keywords.de.split(",").map(x=>x.trim()),
  openGraph: {
    title: brandTitle(content.pages.home.title.de),
    description: content.pages.home.description.de,
    type: "website",
    locale: "de_DE",
    siteName: "Bailamos",
  },
  twitter: { card: "summary_large_image" }, // title and description fall back to the Open Graph tags of each page
  // No canonical here: every page sets its own. A layout canonical was inherited by pages without one (Impressum, Datenschutz, AGB) and pointed them at the homepage.
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
}}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Set by middleware.ts from the URL (/en/..., ?lang=en); German is the default.
  const lang = (await headers()).get("x-bailamos-lang") === "en" ? "en" : "de";
  return (
    <html lang={lang}>
      <body className="antialiased">{children}<Analytics /></body>
    </html>
  );
}
