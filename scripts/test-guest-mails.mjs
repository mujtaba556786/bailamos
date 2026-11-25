// Bookings without a table, guest e-mails on confirm / decline / restaurant cancel / guest cancel, no duplicates,
// history entries and "Erneut senden". Mail is recorded, never sent; the database is an in-memory test database.
// Run: npm run test:guest-mails
import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { env } from "cloudflare:workers";
import { defaultOperations } from "../lib/operations-config.ts";
import { createBooking, changeStatus, cancelBooking } from "../lib/booking-service.ts";
import { sendReservationMail, esc } from "../lib/reservation-mail.ts";
import { GET, PATCH, POST } from "../app/api/admin/reservations/route.ts";
import { POST as guestCancel } from "../app/api/reservations/cancel/route.ts";

const ADMIN = "test-admin-key-0123456789", STAFF = "test-staff-key-0123456789";
const now = new Date("2026-11-22T10:00:00Z");
const DATE = "2027-01-15";
const noTables = { ...defaultOperations, tables: defaultOperations.tables.map((table) => ({ ...table, enabled: false })) };
const instances = [];
after(() => Promise.all(instances.map((mf) => mf.dispose())));
beforeEach(() => { globalThis.__mails = []; globalThis.__mailFail = false; });

async function freshDb() {
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', d1Databases: ["DB"] });
  instances.push(mf);
  const db = await mf.getD1Database("DB");
  for (const file of (await readdir(new URL("../drizzle/", import.meta.url))).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((value) => value.trim())) await db.prepare(statement).run();
  }
  env.DB = db; env.ADMIN_API_KEY = ADMIN; env.STAFF_ADMIN_KEY = STAFF;
  return db;
}
let counter = 0;
async function book(db, overrides = {}) {
  counter += 1;
  const body = { date: DATE, time: "19:00", guestCount: 2, tableId: "restaurant-choice", customer: { name: "Test Guest", phone: `+4917000000${String(counter).padStart(2, "0")}`, email: `guest${counter}@example.com` }, occasion: "", dietary: "", notes: "", marketingConsent: false, ...overrides };
  return createBooking(db, body, `test-key-${counter}-${"x".repeat(20)}`, now, noTables);
}
const admin = (method, url, body, key = ADMIN) => new Request(`http://test${url}`, { method, headers: { "x-admin-key": key, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const patch = (id, status, version, extra = {}) => PATCH(admin("PATCH", "/api/admin/reservations", { id, status, version, ...extra }));
const events = async (id) => (await (await GET(admin("GET", `/api/admin/reservations?id=${id}`))).json());
const mailEvents = (detail) => detail.events.filter((event) => event.actor === "system" && event.reason.startsWith("E-Mail")).map((event) => event.reason);

test("a booking without a table is saved and shown as 'Ohne Tisch' (list and detail), never with open-R", async () => {
  const db = await freshDb();
  const first = await book(db), second = await book(db); // same time, no table conflict
  assert.ok(first.reservation.tableId.startsWith("open-"));
  assert.ok(second.reservation.id !== first.reservation.id);
  const list = await (await GET(admin("GET", `/api/admin/reservations?date=${DATE}`))).json();
  assert.equal(list.reservations.length, 2);
  assert.ok(list.reservations.every((row) => row.table_name === "Ohne Tisch" && row.table_id === ""));
  const detail = await events(first.reservation.id);
  assert.equal(detail.reservation.table_name, "Ohne Tisch");
  assert.ok(!JSON.stringify([list, detail]).includes("open-"));
  const pending = await (await GET(admin("GET", "/api/admin/reservations?pending=1"))).json();
  assert.ok(pending.reservations.every((row) => row.table_name === "Ohne Tisch"));
  const range = await (await GET(admin("GET", `/api/admin/reservations?from=${DATE}&to=${DATE}`))).json();
  assert.equal(range.reservations.length, 2);
});

test("confirm sends exactly one mail", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  const response = await patch(reservation.id, "confirmed", 0);
  assert.equal(response.status, 200);
  assert.equal(globalThis.__mails.length, 1);
  assert.equal(globalThis.__mails[0].to, "guest1@example.com".replace("1", String(counter)));
  assert.deepEqual(mailEvents(await events(reservation.id)), ["E-Mail gesendet"]);
});

test("decline sends the German+English mail with the reason; the reason is HTML-escaped; no table wording", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  const reason = '<script>alert(1)</script> "x" & y';
  assert.equal((await patch(reservation.id, "declined", 0, { reason })).status, 200);
  assert.equal(globalThis.__mails.length, 1);
  const mail = globalThis.__mails[0];
  assert.match(mail.subject, /^Ihre Reservierungsanfrage im Bailamos Waldcafé \/ Your reservation request – BLMS-/);
  assert.ok(mail.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;") && !mail.html.includes("<script>alert"));
  assert.ok(mail.text.includes(`Grund: ${reason}`) && mail.text.includes(`Reason: ${reason}`));
  assert.ok(mail.text.includes("+49 179 6881793") && mail.text.includes("info@bailamos-waldcafe.de"));
  assert.ok(mail.text.includes("15.01.2027") && mail.text.includes("15 January 2027"));
  assert.ok(!/tisch|table/i.test(mail.text));
  assert.ok(mail.text.indexOf("Guten Tag") < mail.text.indexOf("Hello"));
});

test("an empty reason leaves out the reason line", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  await patch(reservation.id, "declined", 0, { reason: "   " });
  const mail = globalThis.__mails[0];
  assert.ok(!mail.text.includes("Grund") && !mail.text.includes("Reason:") && !mail.html.includes("Grund"));
});

test("the restaurant cancelling sends mail 1 with reason and phone", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  await patch(reservation.id, "confirmed", 0);
  globalThis.__mails = [];
  assert.equal((await patch(reservation.id, "cancelled", 1, { reason: "Wasserschaden" })).status, 200);
  assert.equal(globalThis.__mails.length, 1);
  const mail = globalThis.__mails[0];
  assert.match(mail.subject, /^Absage Ihrer Reservierung im Bailamos Waldcafé \/ Your reservation has been cancelled – BLMS-/);
  assert.ok(mail.text.includes("Grund: Wasserschaden") && mail.text.includes("Reason: Wasserschaden") && mail.text.includes("+49 179 6881793"));
  assert.ok(mail.text.includes("Herzliche Grüße") && mail.text.includes("Kind regards"));
});

test("checkbox off: no mail and no mail entry", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  assert.equal((await patch(reservation.id, "declined", 0, { reason: "intern", notifyGuest: false })).status, 200);
  assert.equal(globalThis.__mails.length, 0);
  assert.deepEqual(mailEvents(await events(reservation.id)), []);
});

test("the same status twice, or two quick clicks, send only one mail", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  const [a, b] = await Promise.all([patch(reservation.id, "declined", 0, { reason: "x" }), patch(reservation.id, "declined", 0, { reason: "x" })]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  assert.equal(globalThis.__mails.length, 1);
  const repeat = await patch(reservation.id, "declined", 1, { reason: "x" }); // already declined: nothing changes
  assert.equal(repeat.status, 200);
  assert.equal(globalThis.__mails.length, 1);
  assert.deepEqual(mailEvents(await events(reservation.id)), ["E-Mail gesendet"]);
});

test("a failed mail is logged in the history and 'Erneut senden' works, for the admin only", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  globalThis.__mailFail = true;
  assert.equal((await patch(reservation.id, "declined", 0, { reason: "x" })).status, 200);
  assert.deepEqual(mailEvents(await events(reservation.id)), ["E-Mail fehlgeschlagen"]);
  assert.equal((await POST(admin("POST", "/api/admin/reservations", { id: reservation.id, action: "resend-mail" }, STAFF))).status, 403);
  assert.equal((await POST(admin("POST", "/api/admin/reservations", { id: reservation.id, action: "resend-mail" }, "wrong"))).status, 401);
  globalThis.__mailFail = false;
  const resend = await POST(admin("POST", "/api/admin/reservations", { id: reservation.id, action: "resend-mail" }));
  assert.deepEqual(await resend.json(), { ok: true, sent: true });
  assert.equal(globalThis.__mails.length, 1);
  assert.deepEqual(mailEvents(await events(reservation.id)).sort(), ["E-Mail fehlgeschlagen", "E-Mail gesendet"]);
  assert.equal((await POST(admin("POST", "/api/admin/reservations", { id: reservation.id, action: "nope" }))).status, 400);
  assert.equal((await POST(admin("POST", "/api/admin/reservations", { id: "missing", action: "resend-mail" }))).status, 404);
});

test("status endpoints need the admin key; the reason is limited to 500 characters", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  assert.equal((await patch(reservation.id, "declined", 0, {}).then(() => PATCH(admin("PATCH", "/api/admin/reservations", { id: reservation.id, status: "cancelled", version: 1 }, "wrong")))).status, 401);
  const fresh = await book(db);
  assert.equal((await patch(fresh.reservation.id, "declined", 0, { reason: "x".repeat(501) })).status, 400);
  assert.equal((await patch(fresh.reservation.id, "declined", 0, { notifyGuest: "yes" })).status, 400);
});

test("a guest cancelling online sends mail 3 and a short notice, never mail 1, and only once", async () => {
  const db = await freshDb(), booked = await book(db);
  const cancel = () => guestCancel(new Request("http://test/api/reservations/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: booked.reservation.id, token: booked.cancellationToken }) }));
  const first = await cancel();
  assert.equal(first.status, 200);
  assert.equal(globalThis.__mails.length, 2);
  const [guestMail, notice] = globalThis.__mails;
  assert.match(guestMail.subject, /^Stornierung bestätigt \/ Cancellation confirmed – BLMS-/);
  assert.equal(guestMail.to, `guest${counter}@example.com`);
  assert.ok(!guestMail.text.includes("Grund") && !/Absage/.test(guestMail.subject));
  assert.equal(notice.to, "info@bailamos-waldcafe.de");
  assert.match(notice.subject, /^Gast hat storniert: 15\.01\.2027 19:00, 2 Gäste, BLMS-/);
  assert.equal((await cancel()).status, 200);
  assert.equal(globalThis.__mails.length, 2);
  // "Erneut senden" for a guest cancellation repeats mail 3, never the restaurant-cancel mail.
  const resend = await POST(admin("POST", "/api/admin/reservations", { id: booked.reservation.id, action: "resend-mail" }));
  assert.equal(resend.status, 200);
  assert.match(globalThis.__mails[2].subject, /^Stornierung bestätigt/);
});

// ---- More coverage: normal table bookings, errors, the other mail kinds ----
const withTables = (db, overrides = {}, key = `table-key-${counter}-${"y".repeat(20)}`) => {
  counter += 1;
  const body = { date: DATE, time: "20:00", guestCount: 2, tableId: "restaurant-choice", customer: { name: "Table Guest", phone: `+4917100000${String(counter).padStart(2, "0")}`, email: `table${counter}@example.com` }, occasion: "", dietary: "", notes: "", marketingConsent: true, ...overrides };
  return createBooking(db, body, key + counter, now, defaultOperations);
};

test("with a free table the booking takes it; a replay returns the same booking; duplicates and bad keys are refused", async () => {
  const db = await freshDb();
  const booked = await withTables(db, {}, "same-key-aaaaaaaaaaaaaaaaaaaa");
  assert.ok(booked.reservation.tableId.startsWith("table-"));
  assert.equal(booked.marketingConsent, true);
  const body = { date: DATE, time: "20:00", guestCount: 2, tableId: "restaurant-choice", customer: { name: "Dup", phone: "+491710000999", email: "dup@example.com" }, occasion: "", dietary: "", notes: "", marketingConsent: false };
  const original = await createBooking(db, body, "replay-key-bbbbbbbbbbbbbbbbbbbb", now, defaultOperations);
  const replay = await createBooking(db, body, "replay-key-bbbbbbbbbbbbbbbbbbbb", now, defaultOperations);
  assert.equal(replay.replayed, true);
  assert.equal(replay.reservation.id, original.reservation.id);
  await assert.rejects(createBooking(db, { ...body, customer: { ...body.customer } }, "other-key-cccccccccccccccccccc", now, defaultOperations), { code: "DUPLICATE_BOOKING" });
  await assert.rejects(createBooking(db, body, "short", now, defaultOperations), { code: "INVALID_KEY" });
  await assert.rejects(createBooking(db, body, "replay-key-bbbbbbbbbbbbbbbbbbbb", now, defaultOperations).then(() => createBooking(db, { ...body, guestCount: 3 }, "replay-key-bbbbbbbbbbbbbbbbbbbb", now, defaultOperations)), { code: "KEY_REUSED" });
});

test("when every table is taken, a booking is still accepted without a table; a named table that is taken is refused", async () => {
  const db = await freshDb();
  for (let i = 0; i < defaultOperations.tables.filter((table) => table.enabled).length; i++) await withTables(db, { time: "19:30" });
  const extra = await withTables(db, { time: "19:30" });
  assert.ok(extra.reservation.tableId.startsWith("open-"));
  const named = defaultOperations.tables.find((table) => table.enabled).id;
  await assert.rejects(withTables(db, { time: "19:30", tableId: named }), { code: "NO_AVAILABILITY" });
});

test("changeStatus and cancelBooking refuse wrong states; the admin routes validate their input", async () => {
  const db = await freshDb(), { reservation } = await book(db);
  await assert.rejects(changeStatus(db, "missing", "confirmed", 0, "owner"), { code: "NOT_FOUND" });
  await assert.rejects(changeStatus(db, reservation.id, "confirmed", 5, "owner"), { code: "STALE_VERSION" });
  await assert.rejects(changeStatus(db, reservation.id, "completed", 0, "owner"), { code: "INVALID_TRANSITION" });
  const done = await changeStatus(db, reservation.id, "declined", 0, "owner", "x");
  assert.equal(done.changed, true);
  const again = await changeStatus(db, reservation.id, "declined", 1, "owner");
  assert.equal(again.changed, false);
  const token = (await book(db));
  await changeStatus(db, token.reservation.id, "declined", 0, "owner");
  await assert.rejects(cancelBooking(db, token.reservation.id, token.cancellationToken), { code: "CANNOT_CANCEL" });
  assert.equal((await GET(admin("GET", "/api/admin/reservations"))).status, 400);
  assert.equal((await GET(admin("GET", `/api/admin/reservations?from=${DATE}&to=2020-01-01`))).status, 400);
  assert.equal((await GET(admin("GET", `/api/admin/reservations?id=${"x".repeat(101)}`))).status, 400);
  assert.equal((await GET(admin("GET", "/api/admin/reservations?id=missing"))).status, 404);
  assert.equal((await PATCH(admin("PATCH", "/api/admin/reservations", { id: 5 }))).status, 400);
});

test("the request, confirmation and owner mails are built and sent; a failing mail only returns false", async () => {
  const guest = { id: "R-1", reference: "BLMS-TEST01", name: "Ann <b>", email: "ann@example.com", phone: "+491700000000", date: "2027-01-15", time: "19:00", guests: 4, cancelUrl: "https://example.com/c?t=1&x=2" };
  for (const kind of ["request", "confirmed", "owner", "guest-cancelled", "guest-cancel-notice", "declined", "restaurant-cancelled"]) assert.equal(await sendReservationMail({}, kind, guest), true);
  assert.equal(globalThis.__mails.length, 7);
  assert.ok(globalThis.__mails.every((mail) => mail.html.includes("Ann &lt;b&gt;") || mail.to === "info@bailamos-waldcafe.de"));
  assert.equal(esc(`<&>"'`), "&lt;&amp;&gt;&quot;&#39;");
  globalThis.__mailFail = true;
  assert.equal(await sendReservationMail({}, "confirmed", guest), false);
});
