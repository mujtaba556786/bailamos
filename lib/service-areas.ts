// The places the site may describe as its service area. This one list is used by the server check
// (saving SEO data), the admin checkboxes and the structured data (areaServed).
// Bailamos is in Brandenburg an der Havel (the address never changes). Berlin and the state of Brandenburg were
// added at the owner's request on 13 Nov 2026. Extend this list only with places the restaurant actually serves.
export const serviceAreaOptions = ["Brandenburg an der Havel", "Potsdam", "Havelland", "Werder (Havel)", "Berlin", "Land Brandenburg"] as const;
export type ServiceArea = (typeof serviceAreaOptions)[number];

// schema.org type per place: towns are cities, Havelland is a district (Landkreis), Brandenburg is a federal state.
export const serviceAreaSchemaType: Record<ServiceArea, "City" | "AdministrativeArea" | "State"> = {
  "Brandenburg an der Havel": "City",
  Potsdam: "City",
  Havelland: "AdministrativeArea",
  "Werder (Havel)": "City",
  Berlin: "City",
  "Land Brandenburg": "State",
};

// Name used in the structured data (the state is simply "Brandenburg" there).
const schemaName: Partial<Record<ServiceArea, string>> = { "Land Brandenburg": "Brandenburg" };

export function isServiceArea(value: string): value is ServiceArea {
  return (serviceAreaOptions as readonly string[]).includes(value);
}

// Splits stored areas into allowed ones (in list order, no duplicates) and dropped ones (no longer allowed).
// The admin uses this when loading, so an outdated stored place is never sent back and rejected.
export function cleanServiceAreas(stored: readonly string[]) {
  const set = new Set(stored.map((area) => area.trim()));
  return {
    kept: serviceAreaOptions.filter((area) => set.has(area)) as ServiceArea[],
    dropped: [...set].filter((area) => area && !isServiceArea(area)),
  };
}

// Builds the list from the checkboxes: always in list order, only allowed places.
export function toggleServiceArea(current: readonly string[], area: ServiceArea, checked: boolean): ServiceArea[] {
  return serviceAreaOptions.filter((option) => (option === area ? checked : current.includes(option)));
}

// areaServed for the Restaurant structured data.
export function areaServedJsonLd(areas: readonly string[]) {
  return areas.filter(isServiceArea).map((area) => ({ "@type": serviceAreaSchemaType[area], name: schemaName[area] ?? area }));
}
