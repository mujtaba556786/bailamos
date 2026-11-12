// Deletes reservations older than the retention period (default 6 months after the reservation date).
// Safe by default: without --apply it only counts the rows. With --apply it first saves a full export
// of the production database to backups/, then deletes the old rows.
//
//   node scripts/purge-old-reservations.mjs              # dry run, changes nothing
//   node scripts/purge-old-reservations.mjs --apply      # backup first, then delete
//
// Run it every half year. Requires: npx wrangler login, and the production config in wrangler.production.jsonc.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CONFIG = "wrangler.production.jsonc";
const DATABASE = "bailamos-db";
const MONTHS = 6;
const apply = process.argv.includes("--apply");

// Cutoff in Berlin calendar dates: reservations on or before this date are deleted.
function cutoffDate(months) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const d = new Date(Date.UTC(get("year"), get("month") - 1 - months, get("day")));
  return d.toISOString().slice(0, 10);
}

function wrangler(args) {
  const out = execFileSync("npx", ["wrangler", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out;
}

function query(sql) {
  const out = wrangler(["d1", "execute", DATABASE, "--remote", "--config", CONFIG, "--json", "--command", sql]);
  const parsed = JSON.parse(out.slice(out.indexOf("[")));
  return parsed[0].results;
}

const cutoff = cutoffDate(MONTHS);
const count = query(`SELECT COUNT(*) AS n FROM reservations WHERE date <= '${cutoff}'`)[0].n;
console.log(`Retention: ${MONTHS} months. Cutoff: reservations dated on or before ${cutoff}.`);
console.log(`Reservations to delete: ${count}`);

if (!apply) {
  console.log("Dry run only. Nothing was changed. Run with --apply to back up and delete.");
  process.exit(0);
}

if (count === 0) {
  console.log("Nothing to delete.");
  process.exit(0);
}

// 1. Full backup before any deletion.
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(process.cwd(), "backups");
mkdirSync(backupDir, { recursive: true });
const backupFile = join(backupDir, `bailamos-db-before-purge-${stamp}.sql`);
wrangler(["d1", "export", DATABASE, "--remote", "--config", CONFIG, "--output", backupFile]);
if (!existsSync(backupFile)) throw new Error("Backup was not written. Nothing was deleted.");
console.log(`Backup saved: ${backupFile}`);

// 2. Delete event rows first, then reservations (both only for the old dates).
const sqlFile = join(tmpdir(), `purge-${stamp}.sql`);
writeFileSync(
  sqlFile,
  `DELETE FROM reservation_events WHERE reservation_id IN (SELECT id FROM reservations WHERE date <= '${cutoff}');\nDELETE FROM reservations WHERE date <= '${cutoff}';\n`,
);
wrangler(["d1", "execute", DATABASE, "--remote", "--config", CONFIG, "--file", sqlFile]);
rmSync(sqlFile, { force: true });

const left = query(`SELECT COUNT(*) AS n FROM reservations WHERE date <= '${cutoff}'`)[0].n;
console.log(`Deleted. Old reservations left: ${left}. Keep the backup until you are sure.`);
