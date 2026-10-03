// Production domain; set NEXT_PUBLIC_SITE_URL to override (e.g. for a staging copy).
const fallbackUrl = "https://bailamos-waldcafe.de";

export function getSiteUrl(path = "/") {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackUrl;
  const base = configured.endsWith("/") ? configured : `${configured}/`;
  return new URL(path.replace(/^\//, ""), base);
}

export function absoluteMediaUrl(value: string) {
  try { return new URL(value).toString(); }
  catch { return getSiteUrl(value).toString(); }
}
