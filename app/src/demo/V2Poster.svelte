<script>
  import { sessions, totals, byDay, byMonth, fmtMonth, vRank, DISC_LABEL } from "./derive.js";

  let { data } = $props();

  const t = $derived(totals(data));
  const days = $derived(byDay(data));
  const months = $derived(byMonth(data));

  // heatmap: weeks × 7, Monday-first
  const weeks = $derived.by(() => {
    const dates = data.loadEvents.map((e) => e.date).sort();
    const first = new Date(`${dates[0]}T00:00:00`);
    first.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // back to Monday
    const last = new Date(`${dates[dates.length - 1]}T00:00:00`);
    const out = [];
    let week = [];
    for (const d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const info = days.get(key);
      let lvl = 0;
      if (info?.kind === "workout") lvl = 1;
      if (info?.kind === "climb") {
        const a = info.attempts;
        lvl = a > 60 ? 5 : a > 40 ? 4 : a > 20 ? 3 : 2;
      }
      week.push({ key, lvl, month: d.getDate() === 1 ? d.getMonth() : null });
      if (week.length === 7) { out.push(week); week = []; }
    }
    if (week.length) out.push(week);
    return out;
  });

  const MONTH_ABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  function weekMonthLabel(week) {
    const d = week.find((c) => c.month !== null);
    return d ? MONTH_ABBR[d.month] : "";
  }

  const maxMonthSends = $derived(Math.max(...months.map(([, m]) => m.sends), 1));

  // hardest sends of the year (top 6 unique by name/grade)
  const hardest = $derived.by(() => {
    const all = [];
    for (const e of sessions(data))
      for (const c of e.climbs ?? [])
        if (c.sent && vRank(c.grade) !== null)
          all.push({ grade: c.grade, rank: vRank(c.grade), name: c.name, venue: e.gym_name ?? e.location ?? DISC_LABEL[e.discipline] ?? e.discipline, date: e.date, first: !c.repeat });
    all.sort((a, b) => b.rank - a.rank || a.date.localeCompare(b.date));
    const seen = new Set(); const out = [];
    for (const s of all) {
      const k = `${s.name ?? "?"}-${s.grade}`;
      if (seen.has(k)) continue;
      seen.add(k); out.push(s);
      if (out.length === 6) break;
    }
    return out;
  });

  // injury bands across the year
  const span = $derived.by(() => {
    const dates = data.loadEvents.map((e) => e.date).sort();
    return { a: new Date(`${dates[0]}T00:00:00`).getTime(), b: new Date(`${dates[dates.length - 1]}T00:00:00`).getTime() };
  });
  function band(inj) {
    const s = new Date(`${inj.onset_date}T00:00:00`).getTime();
    const e = inj.resolved_date ? new Date(`${inj.resolved_date}T00:00:00`).getTime() : span.b;
    const x = ((s - span.a) / (span.b - span.a)) * 100;
    const w = ((e - s) / (span.b - span.a)) * 100;
    return `left:${x.toFixed(1)}%;width:${Math.max(w, 0.5).toFixed(1)}%`;
  }
  const num = (n) => n.toLocaleString("en-US");
</script>

<div class="v2">
  <header>
    <span class="brand">CLIMBLOG</span>
    <span class="sub">ONE YEAR OF BOULDERING — AUG 2025 / JUL 2026</span>
    <nav><a href="#v1">V1</a><a href="#v2" class="on">V2</a><a href="#v3">V3</a></nav>
  </header>

  <div class="tiles">
    <div class="tile"><span class="n">{num(t.sessions)}</span><span class="l">SESSIONS</span></div>
    <div class="tile"><span class="n">{num(t.sends)}</span><span class="l">SENDS</span></div>
    <div class="tile"><span class="n">{t.top}</span><span class="l">HARDEST SEND</span></div>
    <div class="tile"><span class="n">{num(t.firsts)}</span><span class="l">FIRST SENDS</span></div>
    <div class="tile"><span class="n">{num(Math.round(t.minutes / 60))}</span><span class="l">HOURS ON</span></div>
  </div>

  <section>
    <h2>THE YEAR</h2>
    <div class="heatwrap">
      <div class="monthrow">
        {#each weeks as w, i (i)}<span class="mlabel">{weekMonthLabel(w)}</span>{/each}
      </div>
      <div class="heat">
        {#each weeks as w, i (i)}
          <div class="col">
            {#each w as c (c.key)}<i class="l{c.lvl}"></i>{/each}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <div class="duo">
    <section>
      <h2>SENDS / MONTH</h2>
      <div class="bars">
        {#each months as [ym, m] (ym)}
          <div class="bar">
            <span class="v">{m.sends}</span>
            <i style="height:{(m.sends / maxMonthSends) * 130}px"></i>
            <span class="x">{fmtMonth(ym).split(" ")[0]}</span>
          </div>
        {/each}
      </div>
    </section>

    <section>
      <h2>HARDEST OF THE YEAR</h2>
      <ol class="hardlist">
        {#each hardest as h, i (i)}
          <li>
            <span class="hg">{h.grade}</span>
            <span class="hn">{(h.name ?? "GYM CIRCUIT").toUpperCase()}</span>
            <span class="hv">{String(h.venue).toUpperCase()} — {h.date.slice(5, 7)}/{h.date.slice(2, 4)}{h.first ? " — FIRST" : ""}</span>
          </li>
        {/each}
      </ol>
    </section>
  </div>

  <section>
    <h2>INJURIES</h2>
    <div class="bands">
      {#each data.injuries as inj (inj.id)}
        <div class="bandrow">
          <span class="bl">{inj.label?.toUpperCase()}</span>
          <div class="track"><i class="band" class:active={inj.status === "active"} style={band(inj)}></i></div>
          <span class="bs">{inj.status === "active" ? "ACTIVE" : "RESOLVED"}</span>
        </div>
      {/each}
    </div>
  </section>

  <footer>CLIMBLOG — POSTER. EVERY SQUARE IS A DAY. DARKER = MORE ATTEMPTS.</footer>
</div>

<style>
  .v2 {
    background: #fff; color: #000; min-height: 100vh;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 1180px; margin: 0 auto; padding: 28px 32px 80px;
  }
  header { display: flex; align-items: baseline; gap: 18px; border-bottom: 1px solid #000; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .sub { font-size: 10px; letter-spacing: 0.14em; }
  nav { margin-left: auto; display: flex; gap: 10px; }
  nav a { color: #999; text-decoration: none; font-size: 10px; letter-spacing: 0.14em; }
  nav a.on { color: #000; border-bottom: 1px solid #000; }

  .tiles { display: grid; grid-template-columns: repeat(5, 1fr); border-left: 1px solid #000; margin-top: 0; }
  .tile { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 26px 20px 20px; display: flex; flex-direction: column; gap: 8px; }
  .tile .n { font-size: 76px; font-weight: 700; letter-spacing: -0.04em; line-height: 0.9; }
  .tile .l { font-size: 9.5px; letter-spacing: 0.16em; }

  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 500; margin: 44px 0 12px; }

  .heatwrap { border: 1px solid #000; padding: 14px; }
  .monthrow { display: flex; gap: 3px; margin-bottom: 6px; }
  .mlabel { flex: 1 1 0; font-size: 8px; letter-spacing: 0.08em; color: #000; min-width: 0; overflow: visible; white-space: nowrap; }
  .heat { display: flex; gap: 3px; }
  .col { display: flex; flex-direction: column; gap: 3px; flex: 1 1 0; }
  .col i { display: block; width: 100%; aspect-ratio: 1; background: #fff; outline: 1px solid #dcdcdc; outline-offset: -1px; }
  .col i.l1 { background: #d9d9d9; outline: none; }
  .col i.l2 { background: #a6a6a6; outline: none; }
  .col i.l3 { background: #6e6e6e; outline: none; }
  .col i.l4 { background: #383838; outline: none; }
  .col i.l5 { background: #000; outline: none; }

  .duo { display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; }

  .bars { display: flex; align-items: flex-end; gap: 10px; border-bottom: 1px solid #000; padding-bottom: 0; height: 170px; }
  .bar { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; }
  .bar i { width: 100%; background: #000; display: block; }
  .bar .v { font-size: 10px; font-weight: 600; }
  .bar .x { font-size: 8.5px; letter-spacing: 0.1em; padding: 6px 0; }

  .hardlist { list-style: none; margin: 0; padding: 0; }
  .hardlist li { display: grid; grid-template-columns: 64px 1fr auto; align-items: baseline; gap: 14px; border-bottom: 1px solid #e3e3e3; padding: 9px 0; }
  .hardlist li:first-child { border-top: 1px solid #000; }
  .hg { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
  .hn { font-size: 12px; font-weight: 600; letter-spacing: 0.02em; }
  .hv { font-size: 9px; letter-spacing: 0.12em; color: #888; }

  .bands { border-top: 1px solid #000; }
  .bandrow { display: grid; grid-template-columns: 250px 1fr 80px; align-items: center; gap: 16px; border-bottom: 1px solid #e3e3e3; padding: 12px 0; }
  .bl { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .track { position: relative; height: 14px; background: #f2f2f2; }
  .band { position: absolute; top: 0; bottom: 0; background: #000; }
  .band.active::after { content: ""; position: absolute; right: -1px; top: -4px; bottom: -4px; width: 1px; background: #000; }
  .bs { font-size: 9px; letter-spacing: 0.14em; text-align: right; }

  footer { margin-top: 60px; padding-top: 10px; border-top: 1px solid #000; font-size: 9.5px; letter-spacing: 0.14em; color: #888; }

  @media (max-width: 800px) {
    .tiles { grid-template-columns: repeat(2, 1fr); border-top: 1px solid #000; }
    .tile .n { font-size: 48px; }
    .duo { grid-template-columns: 1fr; gap: 0; }
  }
</style>
