import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bailamos | Mexikanisches Restaurant & Cocktail Bar",
  description: "Authentische mexikanische Küche, Cocktails und besondere Abende bei Bailamos.",
  keywords: ["Mexikanisches Restaurant Berlin", "Cocktail Bar Berlin", "Tisch reservieren", "Mexikanische Küche"],
  openGraph: {
    title: "Bailamos | Mexikanisches Restaurant & Cocktail Bar",
    description: "Authentische Aromen, Cocktails und besondere Abende in Berlin.",
    type: "website",
    locale: "de_DE",
  },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"Restaurant",name:"Bailamos",servesCuisine:"Mexican",priceRange:"€€",telephone:"+49 30 123 45 678",email:"hola@bailamos.berlin",address:{"@type":"PostalAddress",streetAddress:"Musterstraße 18",postalCode:"10117",addressLocality:"Berlin",addressCountry:"DE"},acceptsReservations:true,menu:"/menu"})}} /></body>
    </html>
  );
}
