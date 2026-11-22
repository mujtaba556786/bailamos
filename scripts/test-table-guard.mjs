// Future-booking guard on table settings: only real changes to a table with future bookings are refused. Run: npm run test:table-guard
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { defaultOperations, getOperations, saveOperations } from "../lib/operations-config.ts";
import { createBooking } from "../lib/booking-service.ts";

const now = new Date("2026-11-22T10:00:00Z");
const bookingDate = "2027-01-15"; // a Friday, inside opening hours 12:00-22:00
const instances = [];
after(() => Promise.all(instances.map((mf) => mf.dispose())));

// Each test gets its own database so bookings from one test never leak into another.
async function freshDb() {
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', d1Databases: ["DB"] });
  instances.push(mf);
  const db = await mf.getD1Database("DB");
  for (const file of (await readdir(new URL("../drizzle/", import.meta.url))).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((value) => value.trim())) await db.prepare(statement).run();
  }
  return db;
}

function book(db, config, tableId, guestCount) {
  return createBooking(db, {
    date: bookingDate,
    time: "18:00",
    guestCount,
    tableId,
    customer: { name: "Guard Test", phone: "+49123456789", email: "guard@test.example" },
  }, crypto.randomUUID(), now, config);
}

// Saves the defaults (three tables, 4 seats each) and returns the saved version.
async function savedDefaults(db) {
  return saveOperations(db, structuredClone(defaultOperations), 0);
}

const tableIn409 = { status: 409, code: "TABLE_IN_USE" };

test("unchanged table with a future booking: saving a phone change succeeds", async () => {
  const db = await freshDb();
  // A party of 6 was booked on table-08 while it had 6 seats; the saved settings now say 4.
  const first = await savedDefaults(db);
  const sixSeats = structuredClone(first.config);
  sixSeats.tables[0].capacity = 6;
  const withSix = await saveOperations(db, sixSeats, first.version);
  await book(db, withSix.config, "table-08", 6);
  const lowered = structuredClone(withSix.config);
  lowered.tables[0].capacity = 4;
  await db.prepare("UPDATE operations_config SET config_json=? WHERE id='primary'").bind(JSON.stringify(lowered)).run();

  const draft = structuredClone(lowered);
  draft.restaurant.contact.phone = "+491796881793";
  const saved = await saveOperations(db, draft, withSix.version);
  assert.equal(saved.config.restaurant.contact.phone, "+491796881793");
  assert.equal(saved.config.tables[0].capacity, 4);
  assert.equal((await getOperations(db)).config.restaurant.contact.phone, "+491796881793");
});

test("deactivating a table with a future booking is refused", async () => {
  const db = await freshDb();
  const first = await savedDefaults(db);
  await book(db, first.config, "table-08", 2);
  const draft = structuredClone(first.config);
  draft.tables[0].enabled = false;
  await assert.rejects(saveOperations(db, draft, first.version), tableIn409);
});

test("reducing seats below a future party is refused; reducing to exactly the party size is allowed", async () => {
  const db = await freshDb();
  const first = await savedDefaults(db);
  await book(db, first.config, "table-08", 3);
  const tooSmall = structuredClone(first.config);
  tooSmall.tables[0].capacity = 2;
  await assert.rejects(saveOperations(db, tooSmall, first.version), tableIn409);
  const exact = structuredClone(first.config);
  exact.tables[0].capacity = 3;
  const saved = await saveOperations(db, exact, first.version);
  assert.equal(saved.config.tables[0].capacity, 3);
});

test("increasing seats or editing the description of a table with bookings is allowed", async () => {
  const db = await freshDb();
  const first = await savedDefaults(db);
  await book(db, first.config, "table-08", 4);
  const draft = structuredClone(first.config);
  draft.tables[0].capacity = 6;
  draft.tables[0].feature.de = "Neue Beschreibung";
  const saved = await saveOperations(db, draft, first.version);
  assert.equal(saved.config.tables[0].capacity, 6);
  assert.equal(saved.config.tables[0].feature.de, "Neue Beschreibung");
});

test("removing or renaming the ID of a table with a future booking is refused", async () => {
  const db = await freshDb();
  const first = await savedDefaults(db);
  await book(db, first.config, "table-08", 2);
  const removed = structuredClone(first.config);
  removed.tables = removed.tables.filter((table) => table.id !== "table-08");
  await assert.rejects(saveOperations(db, removed, first.version), tableIn409);
  const renamed = structuredClone(first.config);
  renamed.tables[0].id = "table-08-neu";
  await assert.rejects(saveOperations(db, renamed, first.version), tableIn409);
});

test("a table without bookings can be deactivated while another table has a booking", async () => {
  const db = await freshDb();
  const first = await savedDefaults(db);
  await book(db, first.config, "table-08", 2);
  const draft = structuredClone(first.config);
  draft.tables[1].enabled = false; // table-12 has no bookings
  const saved = await saveOperations(db, draft, first.version);
  assert.equal(saved.config.tables[1].enabled, false);
  assert.equal(saved.config.tables[0].enabled, true);
});
