export type Locale = "de" | "en";
export type LocalizedText = { de: string; en: string };

export function localeFrom(value?: string | null): Locale {
  return value === "en" ? "en" : "de";
}

export function localized(value: LocalizedText, locale: Locale) {
  return value[locale] || value.de;
}

export function withLocale(path: string, locale: Locale) {
  if (locale === "de") return path;
  const [base, hash = ""] = path.split("#");
  return `${base === "/" ? "/en" : `/en${base}`}${hash ? `#${hash}` : ""}`;
}
