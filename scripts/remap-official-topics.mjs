import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "worker/src/index.js"), "utf8");
const start = src.indexOf("const CHAPTER_CATALOG = {");
const end = src.indexOf("const MAX_JSON_BODY_BYTES");
if (start < 0 || end < 0) throw new Error("Could not locate CHAPTER_CATALOG in worker/src/index.js");
const moduleCode = `${src.slice(start, end)}\nexport { CHAPTER_CATALOG, CHAPTER_KEYWORDS };`;
const tempModule = path.join(root, "scripts/.tmp-chapter-catalog.mjs");
fs.writeFileSync(tempModule, moduleCode);
const { CHAPTER_CATALOG, CHAPTER_KEYWORDS } = await import(tempModule + `?t=${Date.now()}`);

function normalizeTaxonomy(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function canonicalSubject(value) {
  const subject = normalizeTaxonomy(value, 80);
  if (/^physics$/i.test(subject)) return "Physics";
  if (/^chem(?:istry)?$/i.test(subject)) return "Chemistry";
  if (/^math(?:s|ematics)?$/i.test(subject)) return "Mathematics";
  if (/^academic\s*chinese$/i.test(subject) || /^chinese$/i.test(subject)) return "Academic Chinese";
  return subject;
}
function classifyChapter(subject, requested, sourceText = "") {
  const catalog = CHAPTER_CATALOG[subject];
  const normalizedRequested = normalizeTaxonomy(requested, 120);
  if (!catalog?.length) return normalizedRequested;
  const lower = normalizedRequested.toLowerCase();
  const exact = catalog.find((chapter) => chapter.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.length >= 4) {
    const partial = catalog.find((chapter) => {
      const name = chapter.toLowerCase();
      return name.includes(lower) || lower.includes(name) || name.split(/\s+/).filter((part) => part.length > 3).some((part) => lower.includes(part));
    });
    if (partial) return partial;
  }
  const haystack = `${normalizedRequested} ${sourceText}`.toLowerCase();
  let best = catalog[0];
  let bestScore = -1;
  for (const chapter of catalog) {
    const keywords = CHAPTER_KEYWORDS[subject]?.[chapter] || [];
    const nameBonus = haystack.includes(chapter.toLowerCase()) ? chapter.length * 2 : 0;
    const score = nameBonus + keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? keyword.length : 0), 0);
    if (score > bestScore) {
      best = chapter;
      bestScore = score;
    }
  }
  return best;
}

function escapeSql(value) {
  return String(value ?? "").replace(/'/g, "''");
}

const raw = execFileSync("npx", ["wrangler", "d1", "execute", "crossline-mocks", "--remote", "--json", "--command", "SELECT id, subject, chapter, topic, substr(text,1,240) AS text FROM questions"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024
});
const parsed = JSON.parse(raw);
const rows = parsed[0]?.results || parsed.results || [];
const updates = [];
const summary = new Map();
for (const row of rows) {
  const subject = canonicalSubject(row.subject);
  if (!CHAPTER_CATALOG[subject]?.length) continue;
  const topic = classifyChapter(subject, row.chapter || row.topic, `${row.chapter || ""} ${row.topic || ""} ${row.text || ""}`);
  if (row.chapter === topic && row.topic === topic && row.subject === subject) continue;
  updates.push({ id: row.id, subject, topic });
  summary.set(`${subject}::${topic}`, (summary.get(`${subject}::${topic}`) || 0) + 1);
}

console.log(JSON.stringify({ total: rows.length, toUpdate: updates.length, summary: Object.fromEntries([...summary.entries()].sort()) }, null, 2));

if (!updates.length) {
  fs.rmSync(tempModule, { force: true });
  process.exit(0);
}

const statements = updates.map((item) => `UPDATE questions SET subject = '${escapeSql(item.subject)}', chapter = '${escapeSql(item.topic)}', topic = '${escapeSql(item.topic)}', updated_at = datetime('now') WHERE id = '${escapeSql(item.id)}';`);
const sqlPath = path.join(root, "worker/migrations/0014_remap_official_topics.sql");
fs.writeFileSync(sqlPath, `${statements.join("\n")}\n`);
console.log(`Wrote ${statements.length} updates to ${sqlPath}`);

if (process.argv.includes("--apply")) {
  execFileSync("npx", ["wrangler", "d1", "execute", "crossline-mocks", "--remote", "--file", sqlPath], {
    cwd: root,
    stdio: "inherit",
    maxBuffer: 20 * 1024 * 1024
  });
}

fs.rmSync(tempModule, { force: true });
