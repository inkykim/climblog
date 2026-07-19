// Compile all entry files into a single public/data.json the app fetches at runtime.
// Runs at build time (npm run build) and in dev. Keeps reads to ONE request — no
// per-file GitHub API calls, no auth needed for a public repo.
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", ".."); // app/scripts -> app -> repo root
const APP = resolve(__dirname, ".."); // app/

// YAML parses `date: 2026-07-19` into a Date object; normalize back to a plain
// YYYY-MM-DD string so the app (and any consumer) sees consistent strings.
function normalizeDates(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(normalizeDates);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalizeDates(v)]),
    );
  }
  return value;
}

function loadDir(rel) {
  const dir = join(REPO, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => extname(f) === ".md")
    .map((f) => {
      const parsed = matter(readFileSync(join(dir, f), "utf8"));
      return { ...normalizeDates(parsed.data), _notes: parsed.content.trim() };
    });
}

const data = {
  generatedAt: new Date().toISOString(),
  loadEvents: loadDir("entries/load-events"),
  symptomObservations: loadDir("entries/symptom-observations"),
  injuries: loadDir("injuries"),
};

const outDir = join(APP, "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "data.json"), JSON.stringify(data, null, 2));

console.log(
  `compiled data.json: ${data.loadEvents.length} load events, ` +
    `${data.symptomObservations.length} symptom observations, ` +
    `${data.injuries.length} injuries`,
);
