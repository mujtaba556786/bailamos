// Upload validation and admin rate limiting. Run: npm run test:admin-security
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { detectMediaType, peekStream, MAX_UPLOAD_BYTES, UPLOAD_TYPES } from "../lib/media-upload.ts";
import { adminRateLimit, ADMIN_LIMITS } from "../lib/admin-rate-limit.ts";

const bytes = (...values) => new Uint8Array([...values, ...new Array(16).fill(0)]);
const text = (value, offset = 0) => { const out = new Uint8Array(16); out.set([...value].map((c) => c.charCodeAt(0)), offset); return out; };

test("detectMediaType recognises the allowed file types by content", () => {
  assert.equal(detectMediaType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(detectMediaType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  const webp = text("RIFF"); webp.set([..."WEBP"].map((c) => c.charCodeAt(0)), 8);
  assert.equal(detectMediaType(webp), "image/webp");
  assert.equal(detectMediaType(text("ftyp", 4)), "video/mp4");
  assert.equal(detectMediaType(bytes(0x1a, 0x45, 0xdf, 0xa3)), "video/webm");
});

test("detectMediaType refuses SVG, HTML, scripts, empty and other files", () => {
  assert.equal(detectMediaType(text("<svg xmlns=")), null);
  assert.equal(detectMediaType(text("<!DOCTYPE html")), null);
  assert.equal(detectMediaType(text("<script>")), null);
  assert.equal(detectMediaType(text("%PDF-1.7")), null);
  assert.equal(detectMediaType(text("RIFF....AVI ")), null);
  assert.equal(detectMediaType(new Uint8Array()), null);
});

test("upload limits: 50 MB and only five types, no SVG or HTML", () => {
  assert.equal(MAX_UPLOAD_BYTES, 50 * 1024 * 1024);
  assert.deepEqual(Object.keys(UPLOAD_TYPES).sort(), ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
});

const streamOf = (...chunks) => new ReadableStream({ start(c) { for (const chunk of chunks) c.enqueue(new Uint8Array(chunk)); c.close(); } });
const readAll = async (stream) => { const out = []; for await (const chunk of stream) out.push(...chunk); return out; };

test("peekStream returns the first bytes and the complete file, across small chunks", async () => {
  const { head, stream } = await peekStream(streamOf([1, 2, 3], [4, 5], [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], [18]), 16);
  assert.ok(head.length >= 16);
  assert.deepEqual([...head.slice(0, 5)], [1, 2, 3, 4, 5]);
  assert.deepEqual(await readAll(stream), Array.from({ length: 18 }, (_, i) => i + 1));
});

test("peekStream handles files shorter than the peek size and empty files", async () => {
  const short = await peekStream(streamOf([9, 8]), 16);
  assert.deepEqual([...short.head], [9, 8]);
  assert.deepEqual(await readAll(short.stream), [9, 8]);
  const empty = await peekStream(streamOf(), 16);
  assert.equal(empty.head.length, 0);
  assert.deepEqual(await readAll(empty.stream), []);
});

test("peekStream can be cancelled after a failed check", async () => {
  let cancelled = false;
  const source = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(20)); }, cancel() { cancelled = true; } });
  const { stream } = await peekStream(source, 16);
  await stream.cancel();
  assert.equal(cancelled, true);
});

const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', d1Databases: ["DB"] });
after(() => mf.dispose());
let ready;
function migratedDb() { return (ready ??= migrate()); }
async function migrate() {
  const db = await mf.getD1Database("DB");
  for (const file of (await readdir(new URL("../drizzle/", import.meta.url))).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((value) => value.trim())) await db.prepare(statement).run();
  }
  return db;
}
const req = (ip) => new Request("https://x/", { headers: { "cf-connecting-ip": ip } });

test("adminRateLimit allows up to the limit per visitor and hour, then refuses", async () => {
  const db = await migratedDb();
  const now = Date.UTC(2026, 10, 13, 10);
  for (let i = 0; i < ADMIN_LIMITS.upload; i++) await adminRateLimit(db, req("1.1.1.1"), "upload", now);
  await assert.rejects(adminRateLimit(db, req("1.1.1.1"), "upload", now), { code: "TOO_MANY_REQUESTS", status: 429 });
  // Another visitor, another action and the next hour are counted separately.
  await adminRateLimit(db, req("2.2.2.2"), "upload", now);
  await adminRateLimit(db, req("1.1.1.1"), "publish", now);
  await adminRateLimit(db, req("1.1.1.1"), "upload", now + 3600 * 1000);
});

test("adminRateLimit publish message and missing IP header", async () => {
  const db = await migratedDb();
  const now = Date.UTC(2026, 10, 13, 12);
  for (let i = 0; i < ADMIN_LIMITS.publish; i++) await adminRateLimit(db, new Request("https://x/"), "publish", now);
  await assert.rejects(adminRateLimit(db, new Request("https://x/"), "publish", now), /Veröffentlichungen/);
});

test("adminRateLimit fails open without a database or table", async () => {
  await adminRateLimit(undefined, req("3.3.3.3"), "upload");
  const broken = { prepare() { return { bind() { return { run: async () => { throw new Error("no such table"); }, first: async () => { throw new Error("no such table"); } }; } }; } };
  await adminRateLimit(broken, req("3.3.3.3"), "upload");
});
