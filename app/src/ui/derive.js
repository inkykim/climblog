// Shared derivations for the design-direction variants. Pure functions over data-demo.json.

export function vRank(grade) {
  const m = /^V(B|\d{1,2})$/i.exec(grade ?? "");
  if (!m) return null;
  return m[1].toUpperCase() === "B" ? -1 : parseInt(m[1], 10);
}

export const DISC_LABEL = {
  gym: "Gym",
  kilter_board: "Kilter Board",
  tb2: "Tension Board 2",
  outdoor: "Outdoor",
};

// TYPE column: boards collapse to "Board"
export const TYPE_LABEL = {
  gym: "Gym",
  kilter_board: "Board",
  tb2: "Board",
  outdoor: "Outdoor",
};

// kyu-dan rank: 8q(easy)…1q, then 1d,2d… ascending difficulty
export function kyuRank(grade) {
  const m = /^(\d{1,2})(q|d)$/i.exec(grade ?? "");
  if (!m) return null;
  return m[2].toLowerCase() === "q" ? 9 - +m[1] : 8 + +m[1];
}

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

// Robust date span across ALL record types; safe on sparse/empty real data.
export function dateSpan(data) {
  const dates = [
    ...data.loadEvents.map((e) => e.date),
    ...data.symptomObservations.map((o) => o.date),
    ...data.injuries.map((i) => i.onset_date),
  ].filter(Boolean).sort();
  if (!dates.length) return null;
  let a = new Date(`${dates[0]}T00:00:00`).getTime();
  let b = new Date(`${dates[dates.length - 1]}T00:00:00`).getTime();
  if (b - a < 29 * 86400000) a = b - 29 * 86400000; // show at least a month of axis
  return { a, b, first: dates[0], last: dates[dates.length - 1] };
}

// ---- Option A: per-venue monthly ceiling, each in its own grading system ----
export function venueSeries(data) {
  const gymById = new Map(data.gyms.map((g) => [g.id, g]));
  const venues = new Map(); // key -> {label, kind, rankFn, labelFor, sessions, monthly: Map}
  for (const e of sessions(data)) {
    let key, label, gym = null;
    if (e.discipline === "gym") { key = e.gym_id; gym = gymById.get(e.gym_id); label = gym?.name ?? "Gym"; }
    else { key = e.discipline; label = DISC_LABEL[e.discipline]; }
    if (!venues.has(key)) {
      let rankFn, labelFor;
      if (gym?.grading === "circuit") {
        const order = new Map(gym.circuits.map((c, i) => [c.name, i]));
        rankFn = (g) => (order.has(g) ? order.get(g) : null);
        labelFor = (r) => gym.circuits[r]?.name?.toUpperCase() ?? "";
      } else if (gym?.grading === "kyu_dan") {
        rankFn = kyuRank;
        labelFor = (r) => (r <= 8 ? `${9 - r}Q` : `${r - 8}D`);
      } else {
        rankFn = vRank;
        labelFor = (r) => `V${r}`;
      }
      venues.set(key, { key, label, rankFn, labelFor, sessions: 0, sends: 0, monthly: new Map() });
    }
    const v = venues.get(key);
    v.sessions++;
    const month = e.date.slice(0, 7);
    for (const c of e.climbs ?? []) {
      if (!c.sent) continue;
      v.sends++;
      const r = v.rankFn(c.grade);
      if (r === null) continue;
      const cur = v.monthly.get(month);
      if (cur === undefined || r > cur) v.monthly.set(month, r);
    }
  }
  return [...venues.values()]
    .filter((v) => v.monthly.size > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .map((v) => ({ ...v, monthly: [...v.monthly.entries()].sort((a, b) => a[0].localeCompare(b[0])) }));
}

// ---- Option B: grade-free effort metrics per month ----
export function monthlyEffort(data) {
  const m = new Map();
  for (const e of sessions(data)) {
    const key = e.date.slice(0, 7);
    if (!m.has(key)) m.set(key, { sendAttempts: 0, sends: 0, flashes: 0, firsts: 0 });
    const agg = m.get(key);
    for (const c of e.climbs ?? []) {
      if (!c.sent) continue;
      agg.sends++;
      agg.sendAttempts += c.attempts ?? 1;
      if ((c.attempts ?? 1) === 1) agg.flashes++;
      if (!c.repeat) agg.firsts++;
    }
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, a]) => ({
    month,
    attemptsPerSend: a.sends ? a.sendAttempts / a.sends : null,
    flashRate: a.sends ? a.flashes / a.sends : null,
    firstShare: a.sends ? a.firsts / a.sends : null,
  }));
}

// acute (1wk) : chronic (mean of prior 4wk) workload ratio on weekly attempts
export function acwr(data) {
  const weeks = weeklyLoad(data);
  return weeks.map((w, i) => {
    const prior = weeks.slice(Math.max(0, i - 4), i);
    const chronic = prior.length ? prior.reduce((a, p) => a + p.attempts, 0) / prior.length : null;
    return { week: w.week, attempts: w.attempts, ratio: chronic ? w.attempts / chronic : null };
  });
}

// ---- Option C: injury science ----
export function alignedRecovery(data) {
  return data.injuries.map((inj) => {
    const onset = new Date(`${inj.onset_date}T00:00:00`).getTime();
    const points = obsFor(data, inj.id).map((o) => ({
      day: Math.round((new Date(`${o.date}T00:00:00`).getTime() - onset) / 86400000),
      pain: o.pain,
    }));
    return { injury: inj, points };
  });
}

// prior-day session attempts vs pain reading (lag-1 dose→response)
export function loadPainLag(data) {
  const attemptsByDate = new Map();
  for (const e of sessions(data)) {
    const a = (e.climbs ?? []).reduce((s, c) => s + (c.attempts ?? 0), 0);
    attemptsByDate.set(e.date, (attemptsByDate.get(e.date) ?? 0) + a);
  }
  return data.injuries.map((inj) => {
    const points = obsFor(data, inj.id).map((o) => {
      const prev = new Date(`${o.date}T00:00:00`);
      prev.setDate(prev.getDate() - 1);
      const prevKey = prev.toISOString().slice(0, 10);
      return { load: attemptsByDate.get(prevKey) ?? 0, pain: o.pain };
    });
    return { injury: inj, points };
  });
}
