// Server-side checks of the routes behind the hero carousel admin, against a running local preview:
//   npm start -- --port 8788 --var ADMIN_API_KEY:local-test-key   then   npm run test:hero-routes
// BASE_URL and ADMIN_TEST_KEY can be overridden. Never point this at the live site: it saves and restores content.
import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL || "http://localhost:8788";
const KEY = process.env.ADMIN_TEST_KEY || "local-test-key";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("test:hero-routes only runs against a local preview.");

let reachable = true;
before(async () => { try { await fetch(`${BASE}/`); } catch { reachable = false; } });
const call = (path, options = {}, key) => fetch(`${BASE}${path}`, { ...options, headers: { ...(options.headers || {}), ...(key ? { "x-admin-key": key } : {}) } });
const denied = (status) => status === 401 || status === 429; // 429: too many wrong keys from this machine, also a refusal
const png = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(56).fill(0)]);

test("content and upload routes refuse requests without a valid admin key", async (t) => {
  if (!reachable) return t.skip("local preview not running");
  const body = JSON.stringify({ content: {}, version: 0 });
  for (const key of [undefined, "wrong-key"]) {
    assert.ok(denied((await call("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body }, key)).status), `PUT content key=${key}`);
    assert.ok(denied((await call("/api/admin/content", {}, key)).status), `GET content key=${key}`);
    assert.ok(denied((await call("/api/admin/media?purpose=hero", { method: "POST", headers: { "content-type": "image/png" }, body: png() }, key)).status), `POST media key=${key}`);
  }
});

test("hero uploads: only real JPG/PNG/WebP/AVIF up to 5 MB, stored under a random name", async (t) => {
  if (!reachable) return t.skip("local preview not running");
  const upload = (type, data) => call("/api/admin/media?purpose=hero", { method: "POST", headers: { "content-type": type }, body: data }, KEY);
  assert.equal((await upload("image/svg+xml", new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'))).status, 415);
  assert.equal((await upload("image/gif", new TextEncoder().encode("GIF89a................"))).status, 415);
  assert.equal((await upload("video/mp4", new Uint8Array(64))).status, 415);
  assert.equal((await upload("image/avif", png())).status, 415, "PNG bytes sent as AVIF");
  const big = new Uint8Array(5 * 1024 * 1024 + 1); big.set(png().slice(0, 8));
  assert.equal((await upload("image/png", big)).status, 413);
  const ok = await upload("image/png", png());
  assert.equal(ok.status, 200);
  const { url, kind } = await ok.json();
  assert.equal(kind, "image");
  assert.match(decodeURIComponent(url), /^\/api\/media\/marketing\/hero\/[0-9a-f-]{36}\.png$/);
  const served = await fetch(`${BASE}${url}`);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/png");
});

test("saving validates slides on the server and stamps the times there", async (t) => {
  if (!reachable) return t.skip("local preview not running");
  const read = async () => (await call("/api/admin/content", {}, KEY)).json();
  const save = (content, version) => call("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content, version }) }, KEY);
  const original = await read();
  const base = original.content;
  const slide = { ...base.heroCarousel.slides[0], id: "route-test", headline: { de: "Route-Test", en: "Route test" }, createdAt: "1999-01-01T00:00:00.000Z", updatedAt: "1999-01-01T00:00:00.000Z" };
  try {
    for (const bad of [{ ctaHref: "javascript:alert(1)" }, { headline: { de: "", en: "x" } }, { headline: { de: "x".repeat(81), en: "" } }, { image: "javascript:x" }, { startsAt: "2026-12-24", endsAt: "2026-12-01" }]) {
      const response = await save({ ...base, heroCarousel: { ...base.heroCarousel, slides: [{ ...slide, ...bad }] } }, original.version);
      assert.equal(response.status, 400, JSON.stringify(bad));
    }
    const saved = await save({ ...base, heroCarousel: { ...base.heroCarousel, slides: [...base.heroCarousel.slides, slide] } }, original.version);
    assert.equal(saved.status, 200);
    const stored = (await saved.json()).content.heroCarousel.slides.find((item) => item.id === "route-test");
    assert.notEqual(stored.createdAt, "1999-01-01T00:00:00.000Z", "createdAt comes from the server");
    assert.ok(Date.now() - Date.parse(stored.updatedAt) < 60000);
    assert.equal(stored.headline.de, "Route-Test");
  } finally {
    const current = await read();
    if (current.version !== original.version) assert.equal((await save(base, current.version)).status, 200, "restore original content");
  }
});
