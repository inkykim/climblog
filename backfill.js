#!/usr/bin/env node
/*
 * climblog Kaya backfill reviewer — CSV as skeleton, you as ground truth.
 *
 *   ./backfill.js            walk pending sessions from backfill/kaya.csv
 *   ./backfill.js --no-git   write files but skip the end-of-run commit
 *
 * Per session: confirm date (Kaya was often logged a day late), venue,
 * duration, then per climb: attempts (convention: enter=send 5, p=proj 20,
 * or a known number), wall+styles, repeat/label. CSV only contains SENDS —
 * each session ends with an "add unlisted climbs?" loop for fails/projects
 * and a notes prompt (vIntro no-send sessions are exactly this).
 *
 * Progress lives in backfill/progress.json — quit with q anytime, resume later.
 * Everything written is stamped source: kaya. See codebook.md "Backfill provenance".
 */
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const NO_GIT = process.argv.includes("--no-git");
const CSV = process.env.BACKFILL_CSV || path.join(ROOT, "backfill", "kaya.csv");
const PROGRESS = process.env.BACKFILL_PROGRESS || path.join(ROOT, "backfill", "progress.json");

// Boston until this date, Japan after — only affects the DEFAULT date guess;
// you confirm every session anyway.
const JAPAN_FROM = "2026-06-01";

// ---------- input ----------
let ask, closeInput;
if (process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  ask = (q) => new Promise((res) => rl.question(q, (a) => res(a.trim())));
  closeInput = () => rl.close();
} else {
  const queued = fs.readFileSync(0, "utf8").split("\n");
  ask = (q) => {
    const next = queued.shift();
    if (next === undefined) {
      // piped input exhausted — abort instead of silently answering every
      // remaining prompt with defaults (which would fabricate sessions)
      console.log("\n[piped input exhausted — aborting]");
      process.exit(2);
    }
    const a = next.trim();
    process.stdout.write(q + a + "\n");
    return Promise.resolve(a);
  };
  closeInput = () => {};
}

// ---------- small helpers (mirrors ./log) ----------
function shortId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";

function yScalar(v) {
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (/[:#"'\n]/.test(v) || /^\s|\s$/.test(v) || v === "") return JSON.stringify(v);
  return v;
}
function yamlLines(key, v, indent = "") {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v) && v.length && typeof v[0] === "object") {
    const lines = [`${indent}${key}:`];
    for (const item of v) {
      let first = true;
      for (const [k, iv] of Object.entries(item)) {
        if (iv === null || iv === undefined) continue;
        const val = Array.isArray(iv) ? `[${iv.join(", ")}]` : yScalar(iv);
        lines.push(`${indent}  ${first ? "- " : "  "}${k}: ${val}`);
        first = false;
      }
    }
    return lines;
  }
  if (Array.isArray(v)) return [`${indent}${key}: [${v.join(", ")}]`];
  return [`${indent}${key}: ${yScalar(v)}`];
}
function writeEntry(dir, id, fields, notes) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(fields)) lines.push(...yamlLines(k, v));
  lines.push("---");
  const file = path.join(ROOT, dir, `${id}.md`);
  fs.writeFileSync(file, lines.join("\n") + "\n" + (notes ? `${notes}\n` : ""));
  return file;
}
function loadGyms() {
  const dir = path.join(ROOT, "gyms");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    const get = (k) => (text.match(new RegExp(`^${k}:\\s*(.+)$`, "m")) || [])[1]?.trim();
    const circuits = [...text.matchAll(/^\s+-\s+name:\s*(.+)$/gm)].map((m) => m[1].trim());
    return { id: get("id"), name: get("name"), grading: get("grading"), circuits };
  }).filter((g) => g.id);
}

const STYLES = { c: "crimp", p: "pinch", s: "slopy", d: "dynamic", b: "balance", co: "coordination", po: "power" };
const ANGLES = { s: "slab", v: "vert", o: "overhang" };

// ---------- CSV ----------
function parseCsv(text) {
  // simple CSV (Kaya export has no quoted commas in practice; guard lightly)
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(",");
  return lines.filter(Boolean).map((line) => {
    const parts = line.split(",");
    const row = {};
    cols.forEach((c, i) => (row[c] = (parts[i] ?? "").trim()));
    return row;
  });
}

function localDate(utcStr, tz) {
  const m = utcStr.match(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const months = Object.fromEntries("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ").map((x, i) => [x, i]));
  const dt = new Date(Date.UTC(+m[4], months[m[2]], +m[3], +m[5], +m[6], +m[7]));
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  return { iso: fmt.format(dt), utc: dt };
}

function loadSessions() {
  const rows = parseCsv(fs.readFileSync(CSV, "utf8"));
  const groups = new Map(); // key date|gym -> rows
  for (const r of rows) {
    const utcIso = localDate(r.date, "UTC")?.iso ?? "";
    const tz = utcIso >= JAPAN_FROM ? "Asia/Tokyo" : "America/New_York";
    const ld = localDate(r.date, tz);
    if (!ld) continue;
    r._date = ld.iso;
    r._utc = ld.utc.toISOString().replace(".000Z", "Z");
    const key = `${r._date}|${r.gym || "?"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  // merge blank-gym rows into a same-date named group when there's exactly one
  const keys = [...groups.keys()];
  for (const key of keys) {
    const [date, gym] = key.split("|");
    if (gym !== "?") continue;
    const named = keys.filter((k) => k.startsWith(`${date}|`) && !k.endsWith("|?") && groups.has(k));
    if (named.length === 1) {
      groups.get(named[0]).push(...groups.get(key));
      groups.delete(key);
    }
  }
  return [...groups.entries()]
    .map(([key, rs]) => ({ key, date: key.split("|")[0], gymCsv: key.split("|")[1], rows: rs }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- progress ----------
function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS, "utf8")); }
  catch { return { done: {}, gymMap: {}, lastVenue: null }; }
}
const saveProgress = (p) => {
  fs.mkdirSync(path.dirname(PROGRESS), { recursive: true });
  fs.writeFileSync(PROGRESS, JSON.stringify(p, null, 2));
};

// ---------- venue ----------
async function resolveVenue(gymCsv, progress) {
  const gyms = loadGyms();
  // auto-map: previously answered for this CSV gym name
  if (gymCsv !== "?" && progress.gymMap[gymCsv]) {
    const g = gyms.find((x) => x.id === progress.gymMap[gymCsv]);
    if (g) return { kind: "gym", gym: g, auto: true };
  }
  const hint = gymCsv !== "?" ? gymCsv : progress.lastVenue || "";
  const known = gyms.length ? `\n  known: ${gyms.map((g) => g.name).join(", ")}` : "";
  const a = await ask(`venue [enter=${hint || "?"} | gym name | k=kilter t=tb2 o=outdoor]${known}\n> `);
  if (a.toLowerCase() === "k") return { kind: "kilter_board" };
  if (a.toLowerCase() === "t") return { kind: "tb2" };
  if (a.toLowerCase() === "o") {
    const loc = await ask("  outdoor area (enter to skip): ");
    return { kind: "outdoor", location: loc || null };
  }
  const name = a || hint;
  if (!name) return resolveVenue(gymCsv, progress);
  let g = gyms.find((x) => x.name?.toLowerCase() === name.toLowerCase() || slugify(x.name || "") === slugify(name));
  if (!g) {
    console.log(`new gym "${name}" — one-time grading setup:`);
    const gr = await ask("  grading [v=v_scale k=kyu_dan c=circuit]: ");
    const grading = { v: "v_scale", k: "kyu_dan", c: "circuit" }[gr.toLowerCase()] || "v_scale";
    const circuits = [];
    if (grading === "circuit") {
      for (;;) {
        const cname = await ask(`  level ${circuits.length + 1} name (blank=done): `);
        if (!cname) { if (circuits.length) break; console.log("  need one level"); continue; }
        const range = await ask("    approx V range e.g. V2-V4 (enter skip): ");
        const m = range.match(/^V(B|\d{1,2})\s*-\s*V(B|\d{1,2})$/i);
        circuits.push({ name: cname, v_min: m ? `V${m[1].toUpperCase()}` : null, v_max: m ? `V${m[2].toUpperCase()}` : null });
      }
    }
    const id = `${slugify(name)}--${shortId()}`;
    const f = writeEntry("gyms", id, { id, name, grading, circuits: circuits.length ? circuits : null }, "");
    console.log(`  ✓ wrote ${path.relative(ROOT, f)}`);
    g = { id, name, grading, circuits: circuits.map((c) => c.name), createdFile: f };
  }
  if (gymCsv !== "?") progress.gymMap[gymCsv] = g.id;
  progress.lastVenue = g.name;
  return { kind: "gym", gym: g, createdFile: g.createdFile };
}

// ---------- climbs ----------
function normGrade(kayaGrade, grading) {
  const g = kayaGrade.toLowerCase();
  if (g === "vintro") return null; // no-send marker, not a climb
  if (grading !== "v_scale") return null; // circuit/kyu gym: kaya v-grade is a guess — re-ask
  const m = g.match(/^v(b|\d{1,2})$/);
  return m ? `V${m[1].toUpperCase()}` : null;
}

async function askGradeFor(grading, circuits, prompt) {
  const a = await ask(prompt);
  if (a === "") return "";
  if (grading === "kyu_dan") {
    const m = a.match(/^(\d{1,2})\s*(kyu|k|q|dan|d)$/i);
    if (m) return `${m[1]}${/^(k|q)/i.test(m[2]) ? "q" : "d"}`;
    console.log("  kyu/dan, e.g. 3q / 1d"); return askGradeFor(grading, circuits, prompt);
  }
  if (grading === "circuit") {
    const hit = circuits.find((c) => c.toLowerCase() === a.toLowerCase());
    if (hit) return hit;
    console.log(`  circuits: ${circuits.join(", ")}`); return askGradeFor(grading, circuits, prompt);
  }
  const m = a.match(/^v(b|\d{1,2})$/i);
  if (m) return `V${m[1].toUpperCase()}`;
  console.log("  V-scale, e.g. V5"); return askGradeFor(grading, circuits, prompt);
}

async function askAttempts() {
  const a = await ask("  attempts [enter=send(5) | p=proj-send(20) | <n>=known]: ");
  if (a === "") return { attempts: 5, estimated: true };
  if (a.toLowerCase() === "p") return { attempts: 20, estimated: true };
  const n = parseInt(a, 10);
  if (Number.isInteger(n) && n >= 1 && n <= 200) return { attempts: n, estimated: false };
  console.log("  enter, p, or a number");
  return askAttempts();
}

async function askWallStyles(isGym) {
  if (!isGym) return {};
  const a = await ask("  wall+styles [e.g. 'o c,d' | enter skip | u=undo last climb]: ");
  if (a === "") return {};
  if (a.toLowerCase() === "u") return { _undo: true };
  const [w, ...rest] = a.split(/\s+/);
  const out = {};
  if (ANGLES[w?.toLowerCase()]) out.wall_angle = ANGLES[w.toLowerCase()];
  const styleStr = rest.join(",");
  if (styleStr) {
    const styles = styleStr.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      .map((s) => STYLES[s]).filter(Boolean);
    if (styles.length) out.styles = [...new Set(styles)];
  }
  if (!out.wall_angle && !out.styles) {
    console.log("  wall s/v/o then styles c,p,s,d,b,co,po — e.g. 'o c,d'");
    return askWallStyles(isGym);
  }
  return out;
}

async function askRepeatLabel() {
  const a = await ask("  repeat/label [enter=first send | r=repeat | 'r name'/'name' to label]: ");
  if (a === "") return { repeat: false };
  if (a.toLowerCase() === "r") return { repeat: true };
  if (/^r\s+/i.test(a)) return { repeat: true, name: a.replace(/^r\s+/i, "") };
  return { repeat: false, name: a };
}

// ---------- existing-session awareness ----------
function existingOnDate(date) {
  const dir = path.join(ROOT, "entries", "load-events");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.startsWith(`${date}--`)).map((f) => {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    const get = (k) => (text.match(new RegExp(`^${k}:\\s*(.+)$`, "m")) || [])[1]?.trim();
    const climbs = (text.match(/^\s+- grade:/gm) || []).length;
    return { file: path.join(dir, f), rel: `entries/load-events/${f}`, type: get("type"), discipline: get("discipline"), gym_id: get("gym_id"), climbs };
  });
}

function repoValid() {
  const py = fs.existsSync(path.join(ROOT, ".venv", "bin", "python"))
    ? path.join(ROOT, ".venv", "bin", "python") : "python3";
  try {
    execFileSync(py, ["scripts/validate.py"], { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch (e) {
    const out = (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? "");
    if (/ModuleNotFoundError|No such file/.test(out)) return true; // can't validate here — CI will
    console.log(out.split("\n").filter((l) => l.includes("::error")).slice(0, 6).join("\n"));
    return false;
  }
}

async function openEditor(file) {
  if (!process.stdin.isTTY) { console.log(`  (non-interactive: edit ${file} yourself)`); return; }
  const ed = process.env.EDITOR || "nano";
  for (;;) {
    try { execFileSync(ed, [file], { cwd: ROOT, stdio: "inherit" }); }
    catch { console.log(`  editor exited with error — check ${file}`); }
    if (repoValid()) { console.log("  ✓ valid"); return; }
    const again = await ask("  edit broke validation (errors above) — re-edit? [Y/n]: ");
    if (again.toLowerCase() === "n") { console.log("  ⚠ leaving invalid — CI will be red until fixed"); return; }
  }
}

function summarize(fields, notes) {
  console.log(`  ┌ ${fields.date} · ${fields.discipline}${fields.gym_id ? ` · ${fields.gym_id.split("--")[0]}` : ""}${fields.location ? ` · ${fields.location}` : ""}${fields.duration_min ? ` · ${fields.duration_min} min` : ""}`);
  for (const c of fields.climbs ?? []) {
    console.log(`  │ ${c.grade}${c.name ? ` "${c.name}"` : ""}${c.wall_angle ? ` ${c.wall_angle}` : ""}${c.styles ? ` [${c.styles.join(",")}]` : ""}${c.board_angle != null ? ` ${c.board_angle}°` : ""} ×${c.attempts}${c.attempts_estimated ? "~" : ""} ${c.sent ? (c.repeat ? "✓rpt" : "✓first") : "✗"}`);
  }
  console.log(`  └ notes: ${notes || "—"}`);
}

// ---------- git ----------
function git(...args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }
function commitAndPush(files, summary) {
  git("add", ...files.map((f) => path.relative(ROOT, f)));
  git("commit", "-m", `log: ${summary}`);
  console.log(`✓ committed: log: ${summary}`);
  try { execFileSync("git", ["push"], { cwd: ROOT, stdio: "pipe" }); console.log("✓ pushed"); }
  catch { console.log("⚠ push failed — committed locally, push later"); }
}

// ---------- main ----------
(async function main() {
  const sessions = loadSessions();
  const progress = loadProgress();
  const pending = sessions.filter((s) => !progress.done[s.key]);
  console.log(`KAYA BACKFILL — ${sessions.length} sessions total, ${pending.length} pending`);
  console.log("per climb: enter=send(5) · p=proj-send(20) · number=known · flashes auto=1 · fails added at session end\n");

  const created = [];
  let doneThisRun = 0;

  for (const s of pending) {
    const idx = sessions.indexOf(s) + 1;
    const realRows = s.rows.filter((r) => r.grade.toLowerCase() !== "vintro");
    const vintro = s.rows.length - realRows.length;
    const times = [...new Set(s.rows.map((r) => r._utc.slice(11, 16)))].join(" ");
    console.log(`\n── session ${idx}/${sessions.length} ─ ${s.date} ─ ${s.gymCsv === "?" ? "(no gym in CSV)" : s.gymCsv}`);
    console.log(`   csv: ${realRows.map((r) => `${r.grade}${r.ascent_type === "Flash" || r.ascent_type === "Onsight" ? "⚡" : ""}`).join(" · ") || "—"}${vintro ? ` + ${vintro}×vIntro(no-send)` : ""}  [utc ${times}]`);

    let quit = false, skipped = false, savedFile = null;
    redo: for (;;) {
    const dAns = await ask(`date [enter=${s.date} | b=-1day | YYYY-MM-DD | x=skip | q=quit]: `);
    if (dAns.toLowerCase() === "q") { quit = true; break; }
    if (dAns.toLowerCase() === "x") { skipped = true; break; }
    let date = s.date;
    if (dAns.toLowerCase() === "b") {
      const d = new Date(`${s.date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 1);
      date = d.toISOString().slice(0, 10);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dAns)) date = dAns;

    // date collision: sessions already exist on this date (live or backfilled)
    for (;;) {
      const existing = existingOnDate(date);
      if (!existing.length) break;
      console.log(`${date} already has:`);
      existing.forEach((e, i) => console.log(`  ${i + 1}) ${e.rel} — ${e.discipline ?? e.type}${e.gym_id ? ` (${e.gym_id.split("--")[0]})` : ""} · ${e.climbs} climbs`));
      const col = await ask("[enter=log this as ADDITIONAL session | e=edit existing | x=skip this CSV session]: ");
      if (col.toLowerCase() === "x") { skipped = true; break redo; }
      if (col.toLowerCase() === "e") {
        const which = existing.length === 1 ? existing[0]
          : existing[Math.min(existing.length, Math.max(1, parseInt(await ask(`which? [1-${existing.length}]: `), 10) || 1)) - 1];
        await openEditor(which.file);
        created.push(which.file); // include edit in the end-of-run commit
        continue; // re-show list; enter proceeds, x skips
      }
      break;
    }

    const venue = await resolveVenue(s.gymCsv, progress);
    const isGym = venue.kind === "gym";
    const grading = isGym ? venue.gym.grading : "v_scale";
    const circuits = isGym ? venue.gym.circuits : [];
    if (venue.createdFile) created.push(venue.createdFile); // new gym file must ship with the entries
    if (venue.auto) console.log(`venue: ${venue.gym.name} (mapped)`);

    const durA = await ask("duration min (enter skip): ");
    const duration = /^\d+$/.test(durA) ? parseInt(durA, 10) : null;

    const climbs = [];
    for (let ri = 0; ri < realRows.length; ri++) {
      const r = realRows[ri];
      const flash = r.ascent_type === "Flash" || r.ascent_type === "Onsight";
      const known = /^\d+$/.test(r.attempts) ? parseInt(r.attempts, 10) : null;
      let grade = normGrade(r.grade, grading);
      console.log(`climb ${climbs.length + 1}: csv ${r.grade}${flash ? " FLASH" : ""}${r.climb_name ? ` "${r.climb_name}"` : ""}${known ? ` attempts=${known}` : ""}`);
      if (!grade) grade = await askGradeFor(grading, circuits, `  grade (${grading}): `);
      const c = { grade };
      if (r.climb_name) c.name = r.climb_name;
      if (!isGym && venue.kind !== "outdoor") {
        const ang = await ask("  board angle ° (enter skip, u=undo last climb): ");
        if (ang.toLowerCase() === "u" && climbs.length) {
          console.log(`  ↩ removed ${climbs.pop().grade} — redoing it`);
          ri -= 2; continue;
        }
        if (/^\d+$/.test(ang)) c.board_angle = parseInt(ang, 10);
      }
      const ws = await askWallStyles(isGym);
      if (ws._undo) {
        if (climbs.length) { console.log(`  ↩ removed ${climbs.pop().grade} — redoing it`); ri -= 2; }
        else console.log("  nothing to undo");
        continue;
      }
      Object.assign(c, ws);
      if (flash) c.attempts = known ?? 1;
      else if (known) c.attempts = known;
      else {
        const at = await askAttempts();
        c.attempts = at.attempts;
        if (at.estimated) c.attempts_estimated = true;
      }
      c.sent = true; // every CSV row is an ascent
      const rl2 = await askRepeatLabel();
      c.repeat = rl2.repeat;
      if (rl2.name && !c.name) c.name = rl2.name;
      climbs.push(c);
    }

    // fails/projects aren't in the CSV — add them here
    for (;;) {
      const more = await ask("add unlisted climb (fail/project)? [y/N]: ");
      if (more.toLowerCase() !== "y") break;
      const grade = await askGradeFor(grading, circuits, "  grade: ");
      if (!grade) continue;
      const c = { grade };
      Object.assign(c, await askWallStyles(isGym));
      if (!isGym && venue.kind !== "outdoor") {
        const ang = await ask("  board angle ° (enter skip): ");
        if (/^\d+$/.test(ang)) c.board_angle = parseInt(ang, 10);
      }
      const res = await ask("  result [enter=fail(10) | pf=proj-fail(30) | s(5)/ps(20) | <n>f/<n>s known]: ");
      const conv = { "": [10, false], pf: [30, false], s: [5, true], ps: [20, true] };
      const known = res.match(/^(\d{1,3})(s|f)$/i);
      if (known) { c.attempts = +known[1]; c.sent = known[2].toLowerCase() === "s"; }
      else {
        const [at, sent] = conv[res.toLowerCase()] ?? conv[""];
        c.attempts = at; c.sent = sent; c.attempts_estimated = true;
      }
      const rl3 = await askRepeatLabel();
      c.repeat = rl3.repeat;
      if (rl3.name) c.name = rl3.name;
      climbs.push(c);
      console.log(`  ✓ added ${c.grade}${c.sent ? " (sent)" : ""}`);
    }

    const notes = await ask("notes (enter skip): ");

    const id = `${date}--${shortId()}`;
    const fields = {
      id, type: "climbing_session", date, source: "kaya",
      discipline: isGym ? "gym" : venue.kind,
      gym_id: isGym ? venue.gym.id : null,
      location: venue.location ?? null,
      duration_min: duration,
      climbs: climbs.length ? climbs : null,
    };

    summarize(fields, notes);
    const ok = await ask("save? [enter=save | r=redo session | d=discard (stays pending)]: ");
    if (ok.toLowerCase() === "r") { console.log("  redoing session from the top…"); continue redo; }
    if (ok.toLowerCase() === "d") { console.log("  discarded — session stays pending"); break; }

    savedFile = writeEntry("entries/load-events", id, fields, notes);
    created.push(savedFile);
    progress.done[s.key] = path.relative(ROOT, savedFile);
    saveProgress(progress);
    doneThisRun++;
    console.log(`✓ ${path.relative(ROOT, savedFile)}  (${climbs.length} climbs, ${climbs.filter((c) => c.sent).length} sends) — ${pending.length - doneThisRun} left`);
    break;
    } // redo loop

    if (quit) break;
    if (skipped) { progress.done[s.key] = "skipped"; saveProgress(progress); continue; }
  }

  if (created.length) {
    console.log(`\n${doneThisRun} sessions written this run.`);
    if (NO_GIT) console.log("(--no-git: skipping commit)");
    else commitAndPush(created, `kaya backfill (${doneThisRun} session${doneThisRun === 1 ? "" : "s"})`);
  } else console.log("\nnothing new written.");
  closeInput();
})();
