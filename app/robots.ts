import type { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/site-url";
// Admin, API and booking-management pages stay out of search. Their responses also send X-Robots-Tag noindex (middleware.ts).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/reservierungen/", "/en/reservierungen/"] },
    sitemap: getSiteUrl("/sitemap.xml").toString(),
    host: getSiteUrl().origin,
  };
}
