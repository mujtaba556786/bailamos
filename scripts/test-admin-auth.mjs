// Static checks of the admin and personal-link guards: every /api/admin handler checks the key before it
// touches data, no fallback or default credential exists, and the link lookup/cancel routes are rate limited.
// Run: npm run test:admin-auth
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const GUARD = /\b(requireTab|requireAdmin|accessFor)\s*\(/;
const HANDLER = /^export (async )?function (GET|POST|PUT|PATCH|DELETE)\b/;
const TOP_LEVEL = /^(export )?(async )?function \w+|^export const \w+|^const \w+ = /;

async function routeFiles(dir = new URL("../app/api/admin/", import.meta.url)) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
    if (entry.isDirectory()) out.push(...(await routeFiles(child)));
    else if (entry.name === "route.ts") out.push(child);
  }
  return out;
}

// Splits a route file into top-level blocks keyed by the function name they declare.
function blocksOf(source) {
  const lines = source.split("\n");
  const blocks = new Map();
  let name = null, buffer = [];
  const flush = () => { if (name) blocks.set(name, buffer.join("\n")); };
  for (const line of lines) {
    const declared = line.match(/^(?:export )?(?:async )?(?:function (\w+)|const (\w+) = )/);
    if (declared && TOP_LEVEL.test(line)) { flush(); name = declared[1] || declared[2]; buffer = []; }
    if (name) buffer.push(line);
  }
  flush();
  return blocks;
}

// A handler is guarded when its own code, or a helper it calls from this file, calls a guard.
function guarded(name, blocks, seen = new Set()) {
  if (seen.has(name)) return false;
  seen.add(name);
  const body = blocks.get(name) ?? "";
  if (GUARD.test(body)) return true;
  return [...blocks.keys()].some((helper) => helper !== name && new RegExp(`\\b${helper}\\s*\\(`).test(body) && guarded(helper, blocks, seen));
}

const files = await routeFiles();

test("every /api/admin route file imports a guard and has at least one guarded handler", async () => {
  assert.ok(files.length >= 15, `expected the admin routes, found ${files.length}`);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.match(source, /from ['"][./]*lib\/admin-auth\.ts['"]/, `${file.pathname} must import lib/admin-auth.ts`);
    assert.ok(GUARD.test(source), `${file.pathname} must call a guard`);
  }
});

test("every exported admin handler is guarded, directly or through a helper in the same file", async () => {
  const missing = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const blocks = blocksOf(source);
    const handlers = source.split("\n").map((line) => line.match(HANDLER)?.[2]).filter(Boolean);
    assert.ok(handlers.length > 0, `${file.pathname} exports no handler`);
    for (const method of handlers) {
      const declared = source.split("\n").find((line) => HANDLER.test(line) && line.includes(`function ${method}`));
      // The handler's own block is keyed by its method name; the blocks split on top-level lines, so one-line handlers are single blocks.
      const blockName = blocks.has(method) ? method : [...blocks.keys()].find((key) => blocks.get(key).includes(`function ${method}(`));
      if (!declared || !blockName || !guarded(blockName, blocks)) missing.push(`${file.pathname.split("/app/")[1]} ${method}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("the admin key check has no default or fallback credential, and wrong keys are refused", async () => {
  const source = await readFile(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");
  assert.match(source, /adminKey\.length > 0 && sameDigest/);
  assert.match(source, /staffKey\.length > 0 && sameDigest/);
  assert.match(source, /throw new BookingError\(401, 'UNAUTHORIZED'/);
  assert.match(source, /requireAdmin[\s\S]*!== 'admin'\) throw new BookingError\(403/);
  // No code path may fall back to a literal key or to "admin"/"password" when the variable is missing.
  assert.doesNotMatch(source, /ADMIN_API_KEY\s*\|\|\s*['"][^'"]+['"]/);
  assert.doesNotMatch(source, /STAFF_ADMIN_KEY\s*\|\|\s*['"][^'"]+['"]/);
});

test("no source file falls back to a hard-coded admin or staff key", async () => {
  const hits = [];
  for (const dir of ["../app/", "../lib/", "../components/", "../middleware.ts"]) {
    const base = new URL(dir, import.meta.url);
    const walk = async (url) => {
      for (const entry of await readdir(url, { withFileTypes: true }).catch(() => [])) {
        const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, url);
        if (entry.isDirectory()) await walk(child);
        else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) {
          const text = await readFile(child, "utf8");
          if (/(ADMIN_API_KEY|STAFF_ADMIN_KEY)\s*\|\|\s*['"`][^'"`]+['"`]/.test(text)) hits.push(child.pathname);
        }
      }
    };
    if (dir.endsWith(".ts")) { const text = await readFile(base, "utf8"); if (/(ADMIN_API_KEY|STAFF_ADMIN_KEY)\s*\|\|\s*['"`][^'"`]+['"`]/.test(text)) hits.push(base.pathname); }
    else await walk(base);
  }
  assert.deepEqual(hits, []);
});

test("personal booking link routes check the rate limit before they read or change a booking", async () => {
  for (const [route, call] of [["manage", "getManagedBooking"], ["cancel", "cancelBooking"]]) {
    const source = await readFile(new URL(`../app/api/reservations/${route}/route.ts`, import.meta.url), "utf8");
    const limit = source.indexOf(`adminRateLimit(env.DB, request, '${route === "manage" ? "lookup" : "cancel"}')`);
    assert.ok(limit > 0, `${route} must call adminRateLimit`);
    assert.ok(limit < source.indexOf(call, source.indexOf("export async function POST")), `${route}: the limit must run before ${call}`);
  }
});
