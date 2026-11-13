// SEO service areas, admin checkbox logic, areaServed and JSON-LD escaping. Run: npm run test:seo
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { serviceAreaOptions, isServiceArea, cleanServiceAreas, toggleServiceArea, areaServedJsonLd } from "../lib/service-areas.ts";
import { defaultSeo, saveSeoContent, getSeoContent } from "../lib/seo-content.ts";
import { safeJsonLd } from "../lib/json-ld.ts";

const four = ["Brandenburg an der Havel", "Potsdam", "Havelland", "Werder (Havel)"];
const all = [...four, "Berlin", "Land Brandenburg"];

test("the allowed list has the six places, including Berlin and the state", () => {
  assert.deepEqual([...serviceAreaOptions], all);
  for (const area of all) assert.equal(isServiceArea(area), true);
  assert.equal(isServiceArea("Hamburg"), false);
  assert.equal(isServiceArea("potsdam"), false);
});

test("loading drops stored areas that are no longer allowed and keeps list order", () => {
  assert.deepEqual(cleanServiceAreas(["Werder (Havel)", "Hamburg", " Potsdam ", "Potsdam", "Berlin", "Atlantis", ""]), { kept: ["Potsdam", "Werder (Havel)", "Berlin"], dropped: ["Hamburg", "Atlantis"] });
  assert.deepEqual(cleanServiceAreas([]), { kept: [], dropped: [] });
});

test("checkboxes build the list only from allowed, checked places", () => {
  assert.deepEqual(toggleServiceArea(["Brandenburg an der Havel"], "Potsdam", true), ["Brandenburg an der Havel", "Potsdam"]);
  assert.deepEqual(toggleServiceArea(["Brandenburg an der Havel", "Potsdam"], "Brandenburg an der Havel", false), ["Potsdam"]);
  // A hidden stored place is never carried along by a checkbox change.
  assert.deepEqual(toggleServiceArea(["Hamburg", "Potsdam"], "Havelland", true), ["Potsdam", "Havelland"]);
});

test("areaServed: towns and Berlin as City, Havelland as AdministrativeArea, the state as State; unknown skipped", () => {
  assert.deepEqual(areaServedJsonLd([...all, "Hamburg"]), [
    { "@type": "City", name: "Brandenburg an der Havel" },
    { "@type": "City", name: "Potsdam" },
    { "@type": "AdministrativeArea", name: "Havelland" },
    { "@type": "City", name: "Werder (Havel)" },
    { "@type": "City", name: "Berlin" },
    { "@type": "State", name: "Brandenburg" },
  ]);
});

test("JSON-LD text cannot close the script tag", () => {
  const out = safeJsonLd({ description: "</script><script>alert(1)</script>", x: `a${String.fromCharCode(0x2028)}b` });
  assert.equal(out.includes("</script>"), false);
  assert.equal(out.includes("<"), false);
  assert.match(out, /\\u003c\/script>/);
  assert.match(out, /\\u2028/);
  assert.deepEqual(JSON.parse(out).description, "</script><script>alert(1)</script>");
});

const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', d1Databases: ["DB"] });
after(() => mf.dispose());
let ready;
const database = () => (ready ??= (async () => {
  const db = await mf.getD1Database("DB");
  for (const file of (await readdir(new URL("../drizzle/", import.meta.url))).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((value) => value.trim())) await db.prepare(statement).run();
  }
  return db;
})());
const withAreas = (areas) => ({ ...structuredClone(defaultSeo), serviceAreas: areas });

test("saving succeeds with all six areas, Berlin included, and Berlin stays Berlin when read", async () => {
  const db = await database();
  const saved = await saveSeoContent(db, withAreas(all), 0);
  assert.equal(saved.version, 1);
  assert.deepEqual((await getSeoContent(db)).content.serviceAreas, all);
});

test("saving still refuses unknown places and an empty list", async () => {
  const db = await database();
  await assert.rejects(saveSeoContent(db, withAreas(["Brandenburg an der Havel", "Hamburg"]), 1), (e) => e.code === "INVALID_SEO" && e.status === 400 && /Hamburg/.test(e.message) && /Berlin/.test(e.message));
  await assert.rejects(saveSeoContent(db, withAreas(["Atlantis"]), 1), { code: "INVALID_SEO" });
  await assert.rejects(saveSeoContent(db, withAreas([]), 1), { code: "INVALID_SEO" });
});

test("place names in keywords and brand text are accepted", async () => {
  const db = await database();
  const content = withAreas(four);
  content.keywords = { de: "Mexikanisch essen nahe Potsdam, Tacos Werder (Havel)", en: "Mexican food near Potsdam" };
  content.brandSummary = { de: "Gut erreichbar aus Potsdam und dem Havelland.", en: "Easy to reach from Potsdam." };
  const saved = await saveSeoContent(db, content, 1);
  assert.equal(saved.content.brandSummary.de, "Gut erreichbar aus Potsdam und dem Havelland.");
});
