import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dirname, "..");
const SRC   = resolve(ROOT, "src");
const BUILD = resolve(ROOT, "build");

const files = [
  "tokens.primitives.json",
  "tokens.semantic.json",
  "tokens.typography.json",
];

const merged = {};
const timestamp = new Date().toISOString();

for (const file of files) {
  const path = resolve(SRC, file);
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    const key = Object.keys(data)[0];

    if (merged[key]) {
      console.warn(`⚠️  Duplicate collection key "${key}" in ${file} — skipping`);
      continue;
    }

    merged[key] = data[key];
    console.log(`✓ ${file} → "${key}"`);
  } catch (err) {
    console.error(`✗ Failed to read ${file}: ${err.message}`);
    process.exit(1);
  }
}

mkdirSync(BUILD, { recursive: true });

const out = resolve(BUILD, "tokens.figma.json");
writeFileSync(out, JSON.stringify(merged, null, 2));
console.log(`\n→ build/tokens.figma.json (${(JSON.stringify(merged).length / 1024).toFixed(1)}kb) [${timestamp}]`);