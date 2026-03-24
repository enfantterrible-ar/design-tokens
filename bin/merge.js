/**
 * merge.js
 *
 * Reads src/ token files, merges them into a single DTCG 2025.10 tree, then writes:
 *
 *   build/tokens.dtcg.json         — source of truth, spec-compliant
 *   build/tokens.tokenstudio.json  — Token Studio compatible (git sync target)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { toTokenStudio } from "./transforms/to-token-studio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dirname, "..");
const SRC   = resolve(ROOT, "src");
const BUILD = resolve(ROOT, "build");

const files = [
  "tokens.primitives.json",
  "tokens.semantic.color.json",
  "tokens.semantic.dimensions.json",
  "tokens.semantic.effects.json",
];

/**
 * Simple deep merge for JSON objects
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

const merged = {};
const timestamp = new Date().toISOString();

for (const file of files) {
  const path = resolve(SRC, file);
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    // Skip $-prefixed root keys (e.g. $schema)
    const key = Object.keys(data).find((k) => !k.startsWith("$"));
    if (merged[key]) {
      console.log(`+ Merging into existing key: "${key}" from ${file}`);
      deepMerge(merged[key], data[key]);
    } else {
      merged[key] = data[key];
      console.log(`✓ New root key: "${key}" from ${file}`);
    }
  } catch (err) {
    console.error(`✗ Failed to read ${file}: ${err.message}`);
    process.exit(1);
  }
}

mkdirSync(BUILD, { recursive: true });

// ---------------------------------------------------------------------------
// Output 1: DTCG 2025.10 — untouched, source of truth
// ---------------------------------------------------------------------------

const dtcgOut = resolve(BUILD, "tokens.dtcg.json");
writeFileSync(dtcgOut, JSON.stringify(merged, null, 2));
console.log(`\n→ build/tokens.dtcg.json (${kb(merged)}kb) — DTCG 2025.10 [${timestamp}]`);

// ---------------------------------------------------------------------------
// Output 2: Token Studio — types and values mapped to TS expectations
// ---------------------------------------------------------------------------

const tsOut = resolve(BUILD, "tokens.tokenstudio.json");
writeFileSync(tsOut, JSON.stringify(toTokenStudio(merged), null, 2));
console.log(`→ build/tokens.tokenstudio.json (${kb(toTokenStudio(merged))}kb) — Token Studio [${timestamp}]`);

// ---------------------------------------------------------------------------

function kb(obj) {
  return (JSON.stringify(obj).length / 1024).toFixed(1);
}