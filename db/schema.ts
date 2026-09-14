import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  guestCount: integer("guest_count").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(120),
  tableId: text("table_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  occasion: text("occasion").notNull().default(""),
  dietary: text("dietary").notNull().default(""),
  notes: text("notes").notNull().default(""),
  cancelToken: text("cancel_token").notNull().default(""),
  bookingKeyHash: text("booking_key_hash"),
  bookingPayloadHash: text("booking_payload_hash"),
  duplicateFingerprint: text("duplicate_fingerprint"),
  startsAt: integer("starts_at"),
  endsAt: integer("ends_at"),
  version: integer("version").notNull().default(0),
  updatedBy: text("updated_by").notNull().default("legacy"),
  changeReason: text("change_reason").notNull().default(""),
  newsletterOptIn: integer("newsletter_opt_in", { mode: "boolean" }).notNull().default(false),
  newsletterConsentAt: text("newsletter_consent_at"),
  newsletterSyncedAt: text("newsletter_synced_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_reservations_date_table_status").on(table.date, table.tableId, table.status),
  index("idx_reservations_cancel_token").on(table.cancelToken),
  uniqueIndex("idx_reservations_booking_key").on(table.bookingKeyHash),
  uniqueIndex("idx_reservations_active_duplicate").on(table.duplicateFingerprint)
    .where(sql`${table.status} IN ('pending', 'confirmed', 'arrived', 'seated')`),
  index("idx_reservations_resource_interval").on(table.tableId, table.startsAt, table.endsAt),
]);

export const reservationEvents = sqliteTable("reservation_events", {
  id: text("id").primaryKey(),
  reservationId: text("reservation_id").notNull().references(() => reservations.id),
  previousStatus: text("previous_status"),
  status: text("status").notNull(),
  actor: text("actor").notNull(),
  reason: text("reason").notNull().default(""),
  version: integer("version").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_reservation_events_reservation").on(table.reservationId, table.version)]);

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"),
  consentSource: text("consent_source").notNull().default("reservation"),
  consentAt: text("consent_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_newsletter_subscribers_status").on(table.status),
]);

export const marketingContent = sqliteTable("marketing_content", {
  id: text("id").primaryKey(),
  contentJson: text("content_json").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

export const menuContent = sqliteTable("menu_content", {
  id: text("id").primaryKey(),
  contentJson: text("content_json").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

export const operationsConfig = sqliteTable("operations_config", {
  id: text("id").primaryKey(),
  configJson: text("config_json").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

export const seoContent = sqliteTable("seo_content", {
  id: text("id").primaryKey(),
  contentJson: text("content_json").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});
