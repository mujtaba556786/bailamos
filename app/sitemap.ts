import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const base="https://bailamos.example";return ["","/menu","/reservieren"].map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path==="/menu"?"weekly":"monthly",priority:path===""?1:.8}))}
