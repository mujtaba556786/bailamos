import type { Metadata } from "next";
import { getSiteUrl } from "../lib/site-url";
import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getSeoContent } from "../lib/seo-content.ts";
import "./globals.css";
import { Analytics } from "../components/analytics";

export async function generateMetadata():Promise<Metadata>{const {content}=await getSeoContent(env.DB);return {
  metadataBase: getSiteUrl(),
  title: { default: content.pages.home.title.de, template: "%s | Bailamos" },
  description: content.pages.home.description.de,
  keywords: content.keywords.de.split(",").map(x=>x.trim()),
  openGraph: {
    title: content.pages.home.title.de,
    description: content.pages.home.description.de,
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "Bailamos",
  },
  twitter: { card: "summary_large_image" }, // title and description fall back to the Open Graph tags of each page
  alternates: { canonical: "/" },
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
