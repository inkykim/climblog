// Shared derivations for the design-direction variants. Pure functions over data-demo.json.

export function vRank(grade) {
  const m = /^V(B|\d{1,2})$/i.exec(grade ?? "");
  if (!m) return null;
  return m[1].toUpperCase() === "B" ? -1 : parseInt(m[1], 10);
}

export const DISC_LABEL = {
  gym: "Gym",
  kilter_board: "Kilter",
  tb2: "TB2",
  outdoor: "Outdoor",
};

export function sessions(data) {
  return data.loadEvents
    .filter((e) => e.type === "climbing_session")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function sessionStats(e) {
  const climbs = e.climbs ?? [];
  const sends = climbs.filter((c) => c.sent);
  const firsts = sends.filter((c) => !c.repeat);
  let top = null, topRank = -Infinity;
  for (const c of sends) {
    const r = vRank(c.grade);
    if (r !== null && r > topRank) { topRank = r; top = c.grade; }
  }
  if (!top && sends.length) top = sends[sends.length - 1].grade;
  const attempts = climbs.reduce((a, c) => a + (c.attempts ?? 0), 0);
  return { climbs: climbs.length, sends: sends.length, firsts: firsts.length, top, attempts };
}

export function venueOf(e) {
  return e.gym_name ?? e.location ?? DISC_LABEL[e.discipline] ?? "";
}

// map "YYYY-MM" -> aggregate
export function byMonth(data) {
  const m = new Map();
  for (const e of sessions(data)) {
    const key = e.date.slice(0, 7);
    if (!m.has(key)) m.set(key, { sessions: 0, climbs: 0, sends: 0, firsts: 0, attempts: 0, topRank: -Infinity, top: null });
    const agg = m.get(key);
    const s = sessionStats(e);
    agg.sessions++; agg.climbs += s.climbs; agg.sends += s.sends; agg.firsts += s.firsts; agg.attempts += s.attempts;
    for (const c of (e.climbs ?? []).filter((c) => c.sent)) {
      const r = vRank(c.grade);
      if (r !== null && r > agg.topRank) { agg.topRank = r; agg.top = c.grade; }
    }
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

// per-day map for heatmap/day strip: date -> {kind, attempts}
export function byDay(data) {
  const m = new Map();
  for (const e of data.loadEvents) {
    const cur = m.get(e.date);
    const kind =
      e.type === "climbing_session" ? "climb" : e.type === "rest_workout" ? "workout" : "rest";
    const attempts = (e.climbs ?? []).reduce((a, c) => a + (c.attempts ?? 0), 0);
    if (!cur || kind === "climb") m.set(e.date, { kind, attempts: (cur?.attempts ?? 0) + attempts });
  }
  return m;
}

export function totals(data) {
  const ss = sessions(data);
  let climbs = 0, sends = 0, firsts = 0, attempts = 0, topRank = -Infinity, top = null, minutes = 0;
  for (const e of ss) {
    const s = sessionStats(e);
    climbs += s.climbs; sends += s.sends; firsts += s.firsts; attempts += s.attempts;
    minutes += e.duration_min ?? 0;
    for (const c of (e.climbs ?? []).filter((c) => c.sent)) {
      const r = vRank(c.grade);
      if (r !== null && r > topRank) { topRank = r; top = c.grade; }
    }
  }
  return { sessions: ss.length, climbs, sends, firsts, attempts, top, minutes };
}

// sends per V grade (V-graded climbs only)
export function pyramid(data) {
  const m = new Map();
  for (const e of sessions(data))
    for (const c of e.climbs ?? [])
      if (c.sent) {
        const r = vRank(c.grade);
        if (r !== null) m.set(r, (m.get(r) ?? 0) + 1);
      }
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
}

// max sent V-rank per month → progression
export function progression(data) {
  return byMonth(data).map(([month, agg]) => ({ month, rank: agg.topRank === -Infinity ? null : agg.topRank, top: agg.top }));
}

// weekly attempted volume for load chart: [{week: date-of-monday, attempts, minutes}]
export function weeklyLoad(data) {
  const m = new Map();
  for (const e of data.loadEvents) {
    if (e.type !== "climbing_session" && e.type !== "rest_workout") continue;
    const d = new Date(`${e.date}T00:00:00`);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!m.has(key)) m.set(key, { attempts: 0, minutes: 0 });
    const agg = m.get(key);
    agg.attempts += (e.climbs ?? []).reduce((a, c) => a + (c.attempts ?? 0), 0);
    agg.minutes += e.duration_min ?? 0;
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([week, v]) => ({ week, ...v }));
}

export function obsFor(data, injuryId) {
  return data.symptomObservations
    .filter((o) => o.injury_id === injuryId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// style counts across gym climbs
export function styleCounts(data) {
  const m = new Map();
  for (const e of sessions(data))
    for (const c of e.climbs ?? [])
      for (const s of c.styles ?? []) m.set(s, (m.get(s) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// ---- tiny SVG path helpers (hairline aesthetic) ----
export function linePath(points, w, h, pad = 2) {
  // points: [{x: 0..1, y: 0..1}] normalized; y=0 bottom
  if (!points.length) return "";
  const X = (p) => pad + p.x * (w - 2 * pad);
  const Y = (p) => h - pad - p.y * (h - 2 * pad);
  return points.map((p, i) => `${i ? "L" : "M"}${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join("");
}

export function normalize(values) {
  const max = Math.max(...values, 1);
  const n = values.length;
  return values.map((v, i) => ({ x: n === 1 ? 0.5 : i / (n - 1), y: v / max }));
}

export function fmtMonth(ym) {
  const [y, m] = ym.split("-");
  return ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][+m - 1] + " " + y.slice(2);
}
