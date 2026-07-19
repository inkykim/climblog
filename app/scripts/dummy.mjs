// Generate a deterministic year of demo data → public/data-demo.json
// Used only by the #v1/#v2/#v3 design-direction variants. Never touches entries/.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// deterministic PRNG (mulberry32)
let seed = 20260719;
function rnd() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
let idCounter = 0;
const sid = () => (idCounter++).toString(36).padStart(4, "0");

// ---------- gyms ----------
const gyms = [
  {
    id: "movement-sunnyvale--d1aa",
    name: "Movement Sunnyvale",
    grading: "circuit",
    circuits: [
      { name: "yellow", v_min: "V0", v_max: "V2" },
      { name: "green", v_min: "V2", v_max: "V4" },
      { name: "black", v_min: "V4", v_max: "V6" },
      { name: "pink", v_min: "V6", v_max: "V8" },
    ],
  },
  { id: "dogpatch-boulders--d2bb", name: "Dogpatch Boulders", grading: "v_scale" },
  { id: "b-pump-ogikubo--d3cc", name: "B-Pump Ogikubo", grading: "kyu_dan" },
];

// ---------- injuries ----------
const injuries = [
  {
    id: "a2-right-middle--d4dd", site: "finger_a2", label: "right middle A2 pulley",
    onset_date: "2025-10-14", status: "resolved", resolved_date: "2025-12-21",
    _notes: "Felt a pop on a deep two-finger pocket at Dogpatch.",
  },
  {
    id: "elbow-medial-left--d5ee", site: "elbow_medial", label: "left medial epicondyle",
    onset_date: "2026-02-09", status: "resolved", resolved_date: "2026-04-24",
    _notes: "Golfer's elbow from board volume.",
  },
  {
    id: "shoulder-right--d6ff", site: "shoulder", label: "right shoulder impingement",
    onset_date: "2026-06-27", status: "active",
    _notes: "Pinchy on wide gastons.",
  },
];

// months since start (Aug 2025 = 0) → progression level 0..1
const START = new Date(2025, 7, 1);
const END = new Date(2026, 6, 19);
function progress(d) {
  const ms = d - START;
  return Math.min(1, ms / (END - START));
}

// injury load penalty: within an injury window, reduce intensity
function injuryPenalty(dateStr) {
  let p = 0;
  if (dateStr >= "2025-10-14" && dateStr <= "2025-12-21") p = Math.max(p, 0.5);
  if (dateStr >= "2026-02-09" && dateStr <= "2026-03-15") p = Math.max(p, 0.3);
  if (dateStr >= "2026-06-27") p = Math.max(p, 0.2);
  return p;
}

const STYLES = ["crimp", "pinch", "slopy", "dynamic", "balance", "coordination", "power"];
const KILTER_NAMES = ["Sleepwalker", "Foghorn", "Jank Shui", "Boiler Room", "Static Cling", "Lowball Larry", "Doppler", "Mothership", "Casino", "Bad Manners"];
const TB2_NAMES = ["Tension Classic 12", "Slopey Joe", "Full Value", "Kettle Logic", "The Bruiser", "Nerve Damage", "Soft Serve", "Grip Reaper"];
const OUTDOOR = [
  ["Iron Man Traverse", "V4"], ["The Hunk", "V2"], ["Jedi Mind Tricks", "V4"],
  ["High Plains Drifter", "V7"], ["Saigon", "V6"], ["Solarium", "V4"],
  ["Cave Route", "V3"], ["Green Wall Essential", "V2"], ["King Tut", "V3"],
  ["Seven Spanish Angels", "V6"], ["Flyboy Arete", "V5"], ["Atari", "V6"],
];

function vGrade(base, jitter = 1) {
  const v = Math.max(0, base + ri(-jitter, jitter));
  return `V${v}`;
}

// gym circuit level by progression (Movement)
function circuitFor(p) {
  if (p < 0.2) return chance(0.7) ? "green" : "yellow";
  if (p < 0.5) return chance(0.6) ? "green" : "black";
  if (p < 0.8) return chance(0.65) ? "black" : chance(0.5) ? "green" : "pink";
  return chance(0.45) ? "black" : chance(0.6) ? "pink" : "green";
}
const CIRCUIT_ORDER = { yellow: 0, green: 1, black: 2, pink: 3 };

function gymClimbs(dateStr, p) {
  const pen = injuryPenalty(dateStr);
  const n = Math.max(3, Math.round(ri(6, 12) * (1 - pen * 0.5)));
  const climbs = [];
  for (let i = 0; i < n; i++) {
    const grade = circuitFor(Math.max(0, p - pen * 0.25));
    const hard = CIRCUIT_ORDER[grade] >= 2;
    const sent = chance(hard ? 0.55 : 0.85);
    climbs.push({
      grade,
      wall_angle: pick(["slab", "vert", "overhang", "overhang"]),
      styles: chance(0.35) ? [pick(STYLES), pick(STYLES)].filter((v, i, a) => a.indexOf(v) === i) : [pick(STYLES)],
      attempts: sent ? (hard ? ri(1, 6) : ri(1, 3)) : ri(2, 9),
      sent,
      repeat: sent ? chance(0.3) : chance(0.15),
    });
  }
  return climbs;
}

function boardClimbs(dateStr, p, names, baseAt = (pp) => 3 + Math.round(pp * 4)) {
  const pen = injuryPenalty(dateStr);
  const n = Math.max(2, Math.round(ri(4, 8) * (1 - pen * 0.5)));
  const base = Math.max(2, baseAt(p) - Math.round(pen * 2));
  const climbs = [];
  for (let i = 0; i < n; i++) {
    const g = Math.max(1, base + ri(-2, 1));
    const atLimit = g >= base;
    const sent = chance(atLimit ? 0.4 : 0.8);
    climbs.push({
      name: pick(names),
      grade: `V${g}`,
      board_angle: pick([25, 30, 40, 40, 45]),
      attempts: sent ? (atLimit ? ri(2, 9) : ri(1, 3)) : ri(3, 12),
      sent,
      repeat: sent ? chance(0.25) : chance(0.1),
    });
  }
  return climbs;
}

function kyuClimbs(p) {
  const n = ri(6, 10);
  const climbs = [];
  for (let i = 0; i < n; i++) {
    // around 4q-2q at this progression
    const q = Math.max(1, 5 - ri(0, 2));
    const hard = q <= 3;
    const sent = chance(hard ? 0.5 : 0.85);
    climbs.push({
      grade: `${q}q`,
      wall_angle: pick(["slab", "vert", "overhang"]),
      styles: [pick(STYLES)],
      attempts: sent ? ri(1, 4) : ri(2, 8),
      sent,
      repeat: false,
    });
  }
  return climbs;
}

function outdoorClimbs(dateStr, p) {
  const n = ri(2, 5);
  const climbs = [];
  const cap = 2 + Math.round(p * 4); // V2 → V6
  for (let i = 0; i < n; i++) {
    const [name, grade] = pick(OUTDOOR);
    const g = parseInt(grade.slice(1), 10);
    if (g > cap + 1) { i--; continue; }
    const atLimit = g >= cap;
    const sent = chance(atLimit ? 0.3 : 0.7);
    climbs.push({
      name, grade,
      attempts: sent ? (atLimit ? ri(3, 15) : ri(1, 4)) : ri(4, 20),
      sent,
      repeat: sent ? chance(0.2) : false,
    });
  }
  return climbs;
}

const SESSION_NOTES = [
  "Felt strong on crimps today, slopers still shut me down.",
  "Skin was thin — cut it short before it split.",
  "Worked the project all session, moves are linked in halves now.",
  "Tired from work, low energy but moved anyway.",
  "New set in the cave. Everything feels sandbagged.",
  "Flash go on the black felt easy — maybe ready for the next tier.",
  "Finger felt fine on crimps but pinchy on the deep pockets.",
  "Great session. Everything clicked.",
  "Warmup took forever, only felt recruited in the last hour.",
  "Tried the dyno ~15 times, sticking the catch is the crux.",
  "Elbow talked to me on lock-offs, backed off compression climbs.",
  "Shoulder pinged on a wide gaston, stopped early to be safe.",
  "Repeated old projects to gauge progress — everything felt two grades easier.",
  "Board with the crew, tried everyone's projects.",
  "Conditions were perfect, best friction in months.",
];
const WORKOUT_NOTES = [
  "Push day + rehab protocol.",
  "Easy spin + long hip mobility session.",
  "Max hangs felt solid, +2.5kg from last block.",
  "Deload week, light everything.",
];

// ---------- walk the year ----------
const loadEvents = [];
const observations = [];

const japanStart = "2026-03-14", japanEnd = "2026-03-22";
const bishopTrips = [["2025-11-27", "2025-11-30"], ["2026-05-22", "2026-05-25"]];

for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) {
  const dateStr = iso(d);
  const dow = d.getDay(); // 0 Sun
  const p = progress(d);
  const id = `${dateStr}--${sid()}`;
  const inBishop = bishopTrips.some(([a, b]) => dateStr >= a && dateStr <= b);
  const inJapan = dateStr >= japanStart && dateStr <= japanEnd;

  let ev = null;
  if (inBishop) {
    if (chance(0.75)) {
      ev = { id, type: "climbing_session", date: dateStr, discipline: "outdoor",
        location: "Bishop, CA", duration_min: ri(180, 340), climbs: outdoorClimbs(dateStr, p) };
    } else ev = { id, type: "rest", date: dateStr };
  } else if (inJapan) {
    if (chance(0.6)) {
      const g = gyms[2];
      ev = { id, type: "climbing_session", date: dateStr, discipline: "gym",
        gym_id: g.id, gym_name: g.name, duration_min: ri(90, 160), climbs: kyuClimbs(p) };
    } else ev = { id, type: "nothing", date: dateStr, _notes: "travel day" };
  } else if (dow === 1 || dow === 3) {
    // Mon/Wed: gym
    if (chance(0.85)) {
      const g = chance(0.7) ? gyms[0] : gyms[1];
      ev = { id, type: "climbing_session", date: dateStr, discipline: "gym",
        gym_id: g.id, gym_name: g.name, duration_min: ri(75, 150),
        climbs: g.grading === "circuit" ? gymClimbs(dateStr, p) : boardClimbs(dateStr, p, ["—"], (pp) => 2 + Math.round(pp * 4)).map(({ name, board_angle, ...c }) => ({ ...c, wall_angle: pick(["slab", "vert", "overhang"]), styles: [pick(STYLES)] })) };
    } else ev = { id, type: "rest", date: dateStr };
  } else if (dow === 5) {
    // Fri: boards
    if (chance(0.8)) {
      const kilter = chance(0.6);
      ev = { id, type: "climbing_session", date: dateStr,
        discipline: kilter ? "kilter_board" : "tb2", duration_min: ri(45, 100),
        climbs: boardClimbs(dateStr, p, kilter ? KILTER_NAMES : TB2_NAMES,
          kilter ? (pp) => 3 + Math.round(pp * 4) : (pp) => 2 + Math.round(pp * 4)) };
    } else ev = { id, type: "rest", date: dateStr };
  } else if (dow === 6) {
    // Sat: outdoor monthly-ish, else gym or rest
    if (chance(0.25)) {
      ev = { id, type: "climbing_session", date: dateStr, discipline: "outdoor",
        location: pick(["Castle Rock", "Mortar Rock", "Indian Rock"]),
        duration_min: ri(150, 300), climbs: outdoorClimbs(dateStr, p) };
    } else if (chance(0.5)) {
      const g = gyms[0];
      ev = { id, type: "climbing_session", date: dateStr, discipline: "gym",
        gym_id: g.id, gym_name: g.name, duration_min: ri(90, 160), climbs: gymClimbs(dateStr, p) };
    } else ev = { id, type: "rest", date: dateStr };
  } else if (dow === 2 || dow === 4) {
    // Tue/Thu: rest-day workout
    if (chance(0.65)) {
      ev = { id, type: "rest_workout", date: dateStr, duration_min: ri(30, 70),
        workout_type: pick([["antagonist", "mobility"], ["lifting"], ["hangboard"], ["mobility", "stretching"], ["cardio"]]),
        rpe: ri(3, 7) };
    } else ev = { id, type: "rest", date: dateStr };
  } else {
    // Sun
    ev = chance(0.8) ? { id, type: "rest", date: dateStr } : { id, type: "nothing", date: dateStr };
  }
  if (ev) {
    if (ev.type === "climbing_session" && !ev._notes && chance(0.5)) ev._notes = pick(SESSION_NOTES);
    if (ev.type === "rest_workout" && chance(0.35)) ev._notes = pick(WORKOUT_NOTES);
    loadEvents.push(ev);
  }

  // ---- injury observations ----
  // A2 pulley: 2025-10-14 → 2025-12-21, pain 7 → 0
  if (dateStr >= "2025-10-14" && dateStr <= "2025-12-21" && chance(0.6)) {
    const t = (d - new Date(2025, 9, 14)) / (new Date(2025, 11, 21) - new Date(2025, 9, 14));
    const pain = Math.max(0, Math.round(7 * (1 - t) + ri(-1, 1) * 0.7));
    observations.push({
      id: `${dateStr}--${sid()}`, injury_id: injuries[0].id, date: dateStr, pain,
      load_tolerance: pain >= 5 ? "red" : pain >= 2 ? "yellow" : "green",
    });
  }
  // elbow: 2026-02-09 → 2026-04-24, pain 5 → 0 with a bump
  if (dateStr >= "2026-02-09" && dateStr <= "2026-04-24" && chance(0.5)) {
    const t = (d - new Date(2026, 1, 9)) / (new Date(2026, 3, 24) - new Date(2026, 1, 9));
    const bump = t > 0.4 && t < 0.55 ? 1.5 : 0;
    const pain = Math.max(0, Math.round(5 * (1 - t) + bump + ri(-1, 1) * 0.6));
    observations.push({
      id: `${dateStr}--${sid()}`, injury_id: injuries[1].id, date: dateStr, pain,
      load_tolerance: pain >= 4 ? "red" : pain >= 2 ? "yellow" : "green",
    });
  }
  // shoulder: 2026-06-27 → ongoing, pain ~4 wobbling slowly down
  if (dateStr >= "2026-06-27" && chance(0.7)) {
    const t = (d - new Date(2026, 5, 27)) / (END - new Date(2026, 5, 27));
    const pain = Math.max(1, Math.round(4.4 - 1.5 * t + ri(-1, 1) * 0.6));
    observations.push({
      id: `${dateStr}--${sid()}`, injury_id: injuries[2].id, date: dateStr, pain,
      load_tolerance: pain >= 4 ? "yellow" : pain >= 3 ? "yellow" : "green",
    });
  }
}

const data = {
  generatedAt: new Date().toISOString(),
  demo: true,
  loadEvents,
  symptomObservations: observations,
  injuries,
  gyms,
};

const out = join(APP, "public", "data-demo.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data));
const sessions = loadEvents.filter((e) => e.type === "climbing_session");
console.log(
  `demo data: ${loadEvents.length} load events (${sessions.length} climbing, ` +
    `${sessions.reduce((a, e) => a + (e.climbs?.length ?? 0), 0)} climbs), ` +
    `${observations.length} observations, ${injuries.length} injuries`,
);
