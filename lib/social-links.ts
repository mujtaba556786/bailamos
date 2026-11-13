// Social profile links: which domains belong to which platform, and which links the public site shows.
// An empty link (stored as "#") means the platform is hidden on the website.

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", hosts: ["instagram.com"], example: "https://www.instagram.com/bailamos.waldcafe/" },
  { id: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com"], example: "https://www.facebook.com/…" },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com"], example: "https://www.tiktok.com/@bailamos.waldcafe" },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"], example: "https://www.youtube.com/@…" },
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["id"];
type SocialMap = Record<SocialPlatform, { url: string; handle: string }>;

export const isEmptySocialUrl = (url: string | undefined) => !url || url.trim() === "" || url.trim() === "#";

// "" when the link is fine or empty; otherwise a German message for the admin.
export function socialUrlError(platform: SocialPlatform, url: string) {
  if (isEmptySocialUrl(url)) return "";
  const config = SOCIAL_PLATFORMS.find((item) => item.id === platform)!;
  let parsed: URL;
  try { parsed = new URL(url.trim()); } catch { return `Bitte eine vollständige Adresse eingeben, z. B. ${config.example}`; }
  if (parsed.protocol !== "https:") return "Die Adresse muss mit https:// beginnen.";
  const host = parsed.hostname.toLowerCase();
  if (!config.hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) return `Das ist keine ${config.label}-Adresse (erwartet: ${config.hosts.join(" oder ")}).`;
  if (parsed.pathname === "/" || parsed.pathname === "") return `Bitte die Adresse Ihres ${config.label}-Profils eingeben, nicht nur die Startseite.`;
  return "";
}

// Platforms the public site shows, in display order. Empty links are left out.
export function visibleSocialLinks(social: SocialMap) {
  return SOCIAL_PLATFORMS.filter((platform) => !isEmptySocialUrl(social[platform.id]?.url) && !socialUrlError(platform.id, social[platform.id].url))
    .map((platform) => [platform.label, social[platform.id].url.trim()] as [string, string]);
}
