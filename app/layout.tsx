import type { Metadata } from "next";
import { getSiteUrl } from "../lib/site-url";
import { env } from "cloudflare:workers";
import { getSeoContent } from "../lib/seo-content.ts";
import "./globals.css";

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
  twitter: { card: "summary", title: content.pages.home.title.de, description: content.pages.home.description.de },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
}}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
