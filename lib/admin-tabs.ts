// The admin sections. Staff can only open the ones the admin ticks in Tische & Einstellungen.
export const ADMIN_TABS = ["reservations", "statistics", "newsletter", "content", "studio", "menu", "operations", "seo"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];
export const ADMIN_TAB_LABELS: Record<AdminTab, string> = {
  reservations: "Reservierungen",
  statistics: "Statistik",
  newsletter: "E-Mail",
  content: "Website-Inhalte",
  studio: "Marketing Studio",
  menu: "Speisekarte",
  operations: "Tische & Einstellungen",
  seo: "SEO & AI",
};
export const STAFF_DEFAULT_TABS: AdminTab[] = ["reservations"];

// Features that are built but not ready for staff yet. Hidden tabs stay hidden in the navigation.
export const ADMIN_FEATURES = { marketingStudio: false };

// Server-side rule used by every admin API route: the admin key opens everything,
// a staff key only opens a route if one of the route's areas is in the list the admin ticked.
export function keyMayOpen(role: "admin" | "staff", staffTabs: readonly string[], routeTabs: readonly AdminTab[]) {
  return role === "admin" || routeTabs.some((tab) => staffTabs.includes(tab));
}
