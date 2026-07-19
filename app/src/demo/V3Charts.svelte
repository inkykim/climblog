<script>
  import {
    sessions, sessionStats, venueOf, totals, weeklyLoad, progression,
    pyramid, styleCounts, obsFor, byMonth, fmtMonth, DISC_LABEL,
  } from "./derive.js";

  let { data } = $props();

  const t = $derived(totals(data));
  const weeks = $derived(weeklyLoad(data));
  const prog = $derived(progression(data));
  const pyr = $derived(pyramid(data));
  const styles = $derived(styleCounts(data));
  const months = $derived(byMonth(data));
  const recent = $derived([...sessions(data)].reverse().slice(0, 12));

  // ---- load + pain chart geometry ----
  const W = 1100, H = 240, PAD = { l: 34, r: 8, t: 12, b: 22 };
  const span = $derived.by(() => {
    const dates = data.loadEvents.map((e) => e.date).sort();
    return {
      a: new Date(`${dates[0]}T00:00:00`).getTime(),
      b: new Date(`${dates[dates.length - 1]}T00:00:00`).getTime(),
    };
  });
  const X = (dateStr) =>
    PAD.l + ((new Date(`${dateStr}T00:00:00`).getTime() - span.a) / (span.b - span.a)) * (W - PAD.l - PAD.r);

  const maxAttempts = $derived(Math.max(...weeks.map((w) => w.attempts), 1));
  const loadPath = $derived.by(() => {
    let p = "";
    weeks.forEach((w, i) => {
      const x = X(w.week);
      const y = H - PAD.b - (w.attempts / maxAttempts) * (H - PAD.t - PAD.b);
      p += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return p;
  });
  const loadArea = $derived(
    loadPath
      ? `${loadPath}L${(W - PAD.r).toFixed(1)},${H - PAD.b}L${PAD.l},${H - PAD.b}Z`
      : "",
  );
  const painY = (pain) => H - PAD.b - (pain / 10) * (H - PAD.t - PAD.b);
  function painPath(injId) {
    const obs = obsFor(data, injId);
    return obs.map((o, i) => `${i ? "L" : "M"}${X(o.date).toFixed(1)},${painY(o.pain).toFixed(1)}`).join("");
  }

  // ---- progression steps ----
  const PW = 520, PH = 170, PP = { l: 30, r: 8, t: 10, b: 20 };
  const progPath = $derived.by(() => {
    const pts = prog.filter((p) => p.rank !== null);
    if (!pts.length) return "";
    const maxR = Math.max(...pts.map((p) => p.rank));
    const xs = (i) => PP.l + (i / (prog.length - 1)) * (PW - PP.l - PP.r);
    const ys = (r) => PH - PP.b - (r / maxR) * (PH - PP.t - PP.b);
    let path = "";
    let lastY = null;
    prog.forEach((p, i) => {
      if (p.rank === null) return;
      const x = xs(i), y = ys(p.rank);
      if (lastY === null) path += `M${x},${y}`;
      else path += `L${x},${lastY}L${x},${y}`;
      lastY = y;
    });
    return path;
  });
  const progMax = $derived(Math.max(...prog.filter((p) => p.rank !== null).map((p) => p.rank), 1));

  const maxPyr = $derived(Math.max(...pyr.map(([, c]) => c), 1));
  const maxStyle = $derived(Math.max(...styles.map(([, c]) => c), 1));
  const maxMonthClimbs = $derived(Math.max(...months.map(([, m]) => m.climbs), 1));
  const num = (n) => n.toLocaleString("en-US");
</script>

<div class="v3">
  <header>
    <span class="brand">CLIMBLOG</span>
    <span class="sub">ANNUAL REPORT — AUG 2025 / JUL 2026</span>
    <span class="kpis">{num(t.sessions)} SESSIONS · {num(t.sends)} SENDS · TOP {t.top}</span>
    <nav><a href="#v1">V1</a><a href="#v2">V2</a><a href="#v3" class="on">V3</a></nav>
  </header>

  <section>
    <div class="cap"><h2>FIG. 1 — TRAINING LOAD × INJURY PAIN</h2>
      <span class="legend">▮ WEEKLY ATTEMPTS&nbsp;&nbsp;— PAIN 0–10 PER INJURY</span></div>
    <svg viewBox="0 0 {W} {H}" class="chart">
      {#each [0, 0.25, 0.5, 0.75, 1] as g (g)}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b - g * (H - PAD.t - PAD.b)} y2={H - PAD.b - g * (H - PAD.t - PAD.b)} class="grid" />
      {/each}
      <path d={loadArea} class="area" />
      <path d={loadPath} class="loadline" />
      {#each data.injuries as inj (inj.id)}
        <path d={painPath(inj.id)} class="pain" />
      {/each}
      {#each data.injuries as inj (inj.id)}
        {@const first = obsFor(data, inj.id)[0]}
        {#if first}
          {@const ax = X(first.date)}
          <text x={Math.min(ax, W - 12)} y={painY(first.pain) - 6} class="anno"
            text-anchor={ax > W - 220 ? "end" : "start"}>{inj.label?.toUpperCase()}</text>
        {/if}
      {/each}
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} class="axis" />
      <text x={PAD.l - 6} y={PAD.t + 8} class="tick" text-anchor="end">{maxAttempts}</text>
      <text x={PAD.l - 6} y={H - PAD.b} class="tick" text-anchor="end">0</text>
      {#each months as [ym] (ym)}
        <text x={X(ym + "-15")} y={H - 6} class="tick" text-anchor="middle">{fmtMonth(ym).split(" ")[0]}</text>
      {/each}
    </svg>
  </section>

  <div class="row3">
    <section>
      <div class="cap"><h2>FIG. 2 — MAX SENT GRADE / MONTH</h2></div>
      <svg viewBox="0 0 {PW} {PH}" class="chart">
        {#each Array.from({ length: progMax + 1 }, (_, i) => i) as r (r)}
          <line x1={PP.l} x2={PW - PP.r}
            y1={PH - PP.b - (r / progMax) * (PH - PP.t - PP.b)}
            y2={PH - PP.b - (r / progMax) * (PH - PP.t - PP.b)} class="grid" />
          <text x={PP.l - 5} y={PH - PP.b - (r / progMax) * (PH - PP.t - PP.b) + 3} class="tick" text-anchor="end">V{r}</text>
        {/each}
        <path d={progPath} class="steps" />
      </svg>
    </section>

    <section>
      <div class="cap"><h2>FIG. 3 — SEND PYRAMID</h2></div>
      <div class="pyr">
        {#each [...pyr].reverse() as [rank, count] (rank)}
          <div class="pyrrow">
            <span class="pg">V{rank}</span>
            <div class="ptrack"><i style="width:{(count / maxPyr) * 100}%"></i></div>
            <span class="pc">{count}</span>
          </div>
        {/each}
      </div>
    </section>

    <section>
      <div class="cap"><h2>FIG. 4 — STYLE EXPOSURE</h2></div>
      <div class="pyr">
        {#each styles as [style, count] (style)}
          <div class="pyrrow">
            <span class="pg">{style.toUpperCase()}</span>
            <div class="ptrack"><i style="width:{(count / maxStyle) * 100}%"></i></div>
            <span class="pc">{count}</span>
          </div>
        {/each}
      </div>
    </section>
  </div>

  <section>
    <div class="cap"><h2>FIG. 5 — MONTHLY VOLUME (CLIMBS / FIRST SENDS)</h2></div>
    <div class="mults">
      {#each months as [ym, m] (ym)}
        <div class="mult">
          <div class="mbars">
            <i class="all" style="height:{(m.climbs / maxMonthClimbs) * 64}px"></i>
            <i class="first" style="height:{(m.firsts / maxMonthClimbs) * 64}px"></i>
          </div>
          <span class="mx">{fmtMonth(ym).split(" ")[0]}</span>
          <span class="mv">{m.climbs}/{m.firsts}</span>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <div class="cap"><h2>TABLE 1 — LAST 12 SESSIONS</h2></div>
    <table>
      <thead><tr><th>DATE</th><th>VENUE</th><th>TYPE</th><th class="r">CLIMBS</th><th class="r">SENDS</th><th class="r">TOP</th></tr></thead>
      <tbody>
        {#each recent as e (e.id)}
          {@const s = sessionStats(e)}
          <tr>
            <td class="mono">{e.date}</td>
            <td class="strong">{venueOf(e).toUpperCase()}</td>
            <td class="dim">{DISC_LABEL[e.discipline]?.toUpperCase()}</td>
            <td class="r mono">{s.climbs}</td>
            <td class="r mono">{s.sends}</td>
            <td class="r mono strong">{s.top ?? "—"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <footer>CLIMBLOG — CHART ROOM. ALL FIGURES DERIVED FROM RAW ENTRIES.</footer>
</div>

<style>
  .v3 {
    background: #fff; color: #000; min-height: 100vh;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 1180px; margin: 0 auto; padding: 28px 32px 80px;
    font-size: 13px;
  }
  header { display: flex; align-items: baseline; gap: 18px; border-bottom: 1px solid #000; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .sub { font-size: 10px; letter-spacing: 0.14em; }
  .kpis { font-size: 10px; letter-spacing: 0.12em; margin-left: 8px; color: #888; }
  nav { margin-left: auto; display: flex; gap: 10px; }
  nav a { color: #999; text-decoration: none; font-size: 10px; letter-spacing: 0.14em; }
  nav a.on { color: #000; border-bottom: 1px solid #000; }

  .cap { display: flex; align-items: baseline; gap: 16px; margin: 40px 0 10px; }
  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 600; margin: 0; }
  .legend { font-size: 9px; letter-spacing: 0.1em; color: #888; }

  .chart { width: 100%; height: auto; display: block; border: 1px solid #000; background: #fff; }
  .grid { stroke: #ececec; stroke-width: 1; }
  .axis { stroke: #000; stroke-width: 1; }
  .area { fill: #f0f0f0; stroke: none; }
  .loadline { fill: none; stroke: #9a9a9a; stroke-width: 1; }
  .pain { fill: none; stroke: #000; stroke-width: 1.4; }
  .steps { fill: none; stroke: #000; stroke-width: 1.6; }
  .tick { font-size: 8.5px; letter-spacing: 0.08em; fill: #888; font-family: ui-monospace, Menlo, monospace; }
  .anno { font-size: 8px; letter-spacing: 0.1em; fill: #000; font-weight: 600; }

  .row3 { display: grid; grid-template-columns: 1.15fr 1fr 1fr; gap: 40px; align-items: start; }

  .pyr { border-top: 1px solid #000; }
  .pyrrow { display: grid; grid-template-columns: 58px 1fr 34px; gap: 10px; align-items: center; border-bottom: 1px solid #e3e3e3; padding: 6px 0; }
  .pg { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; }
  .ptrack { height: 12px; background: #f4f4f4; }
  .ptrack i { display: block; height: 100%; background: #000; }
  .pc { font-size: 10px; text-align: right; font-family: ui-monospace, Menlo, monospace; }

  .mults { display: flex; gap: 8px; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 0; }
  .mult { flex: 1; display: flex; flex-direction: column; align-items: center; }
  .mbars { display: flex; gap: 2px; align-items: flex-end; height: 66px; }
  .mbars i { width: 14px; display: block; }
  .mbars .all { background: #c9c9c9; }
  .mbars .first { background: #000; }
  .mx { font-size: 8.5px; letter-spacing: 0.1em; padding: 6px 0 2px; }
  .mv { font-size: 8px; color: #888; font-family: ui-monospace, Menlo, monospace; padding-bottom: 6px; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-weight: 500; font-size: 9.5px; letter-spacing: 0.12em; color: #888; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px 6px 0; }
  th.r { text-align: right; }
  td { border-bottom: 1px solid #e3e3e3; padding: 5px 8px 5px 0; }
  .r { text-align: right; }
  .mono { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
  .dim { color: #888; }
  .strong { font-weight: 600; }
  tbody tr:hover { background: #000; color: #fff; }
  tbody tr:hover .dim { color: #aaa; }

  footer { margin-top: 60px; padding-top: 10px; border-top: 1px solid #000; font-size: 9.5px; letter-spacing: 0.14em; color: #888; }

  @media (max-width: 900px) { .row3 { grid-template-columns: 1fr; } }
</style>
