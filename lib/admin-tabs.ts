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
