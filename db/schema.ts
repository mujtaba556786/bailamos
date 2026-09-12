import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_reservations_date_table_status").on(table.date, table.tableId, table.status),
]);
