import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDirectory = path.join(root, "worker", "migrations");
const files = fs.readdirSync(migrationsDirectory).filter((name) => name.endsWith(".sql")).sort();
const seenNumbers = new Map();

for (const file of files) {
  const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(file);
  assert.ok(match, `Migration filename must use NNNN_description.sql: ${file}`);
  assert.equal(seenNumbers.has(match[1]), false, `Duplicate migration number ${match[1]}: ${seenNumbers.get(match[1])}, ${file}`);
  seenNumbers.set(match[1], file);
  const sql = fs.readFileSync(path.join(migrationsDirectory, file), "utf8").trim();
  assert.ok(sql.length > 0, `Migration is empty: ${file}`);
}

for (let number = 1; number <= 30; number += 1) {
  const key = String(number).padStart(4, "0");
  assert.ok(seenNumbers.has(key), `Migration sequence is missing ${key}`);
}

console.log(`Migration sequence verified (${files.length} files).`);
