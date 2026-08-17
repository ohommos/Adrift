#!/usr/bin/env node
// Regenerates artifacts/api-server/src/data/shores.ts from the world-countries
// dataset. Run with: node scripts/gen-shores.mjs /path/to/world-countries
//
// The output is committed, so this only needs running when the country list
// itself changes. Keeping the generated file in the tree means neither the API
// server nor the app takes a runtime dependency on the dataset.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const pkgDir = process.argv[2] ?? "node_modules/world-countries";
const all = JSON.parse(readFileSync(resolve(pkgDir, "countries.json"), "utf8"));

// Inhabited places the "UN member / independent" test misses.
const EXTRA = new Set(["PS", "TW", "XK"]);
const EXCLUDE = new Set(["IL"]);

const rows = all
  .filter(
    (c) =>
      (c.independent === true || c.unMember === true || EXTRA.has(c.cca2)) &&
      !EXCLUDE.has(c.cca2)
  )
  .map((c) => ({
    code: c.cca2,
    name: c.name.common,
    region: c.subregion || c.region || "Elsewhere",
    lat: Math.round(c.latlng[0] * 100) / 100,
    lon: Math.round(c.latlng[1] * 100) / 100,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

const body = rows
  .map(
    (r) =>
      `  { code: ${JSON.stringify(r.code)}, name: ${JSON.stringify(r.name)}, region: ${JSON.stringify(r.region)}, lat: ${r.lat}, lon: ${r.lon} },`
  )
  .join("\n");

const header = readFileSync(
  resolve("artifacts/api-server/src/data/shores.ts"),
  "utf8"
).split("export const SHORES")[0];

writeFileSync(
  resolve("artifacts/api-server/src/data/shores.ts"),
  `${header}export const SHORES: ShoreSeed[] = [\n${body}\n];\n`
);
console.log(`wrote ${rows.length} shores`);
