<script>
  // OPTION A — VENUE LEDGERS: no cross-venue grade aggregation, ever.
  // Each venue gets its own ceiling-over-time chart in its own grading system.
  import Masthead from "./Masthead.svelte";
  import Fig1 from "./Fig1.svelte";
  import SessionIndex from "./SessionIndex.svelte";
  import { venueSeries, byMonth, fmtMonth } from "./derive.js";

  let { data } = $props();

  const venues = $derived(venueSeries(data));
  const allMonths = $derived(byMonth(data).map(([ym]) => ym));

  const W = 520, H = 170, P = { l: 64, r: 10, t: 12, b: 20 };
  function panel(v) {
    const maxR = Math.max(...v.monthly.map(([, r]) => r), 1);
    const xi = (ym) => allMonths.indexOf(ym);
    const xs = (i) => P.l + (i / Math.max(allMonths.length - 1, 1)) * (W - P.l - P.r);
    const ys = (r) => H - P.b - (r / maxR) * (H - P.t - P.b);
    let path = "", lastY = null;
    for (const [ym, r] of v.monthly) {
      const x = xs(xi(ym)), y = ys(r);
      if (lastY === null) path += `M${x},${y}`;
      else path += `L${x},${lastY}L${x},${y}`;
      lastY = y;
    }
    const dots = v.monthly.map(([ym, r]) => ({ x: xs(xi(ym)), y: ys(r) }));
    const yticks = Array.from({ length: maxR + 1 }, (_, r) => ({ y: ys(r), label: v.labelFor(r) }));
    return { path, dots, yticks, maxR };
  }
</script>

<div class="opt">
  <Masthead {data} sub="OPTION A — VENUE LEDGERS — AUG 2025 / JUL 2026" active="v1" />
  <Fig1 {data} />

  <div class="cap"><h2>FIG. 2 — CEILING PER VENUE (EACH IN ITS OWN GRADING — NEVER COMPARED)</h2></div>
  <div class="panels">
    {#each venues as v (v.key)}
      {@const p = panel(v)}
      <div class="panel">
        <div class="phead">
          <span class="pname">{v.label.toUpperCase()}</span>
          <span class="pstats">{v.sessions} SESSIONS · {v.sends} SENDS</span>
        </div>
        <svg viewBox="0 0 {W} {H}" class="chart">
          {#each p.yticks as t (t.label)}
            <line x1={P.l} x2={W - P.r} y1={t.y} y2={t.y} class="grid" />
            <text x={P.l - 6} y={t.y + 3} class="tick" text-anchor="end">{t.label}</text>
          {/each}
          <path d={p.path} class="steps" />
          {#each p.dots as d (d.x)}
            <rect x={d.x - 2} y={d.y - 2} width="4" height="4" class="dot" />
          {/each}
          {#each allMonths as ym, i (ym)}
            {#if i % 2 === 0}
              <text x={P.l + (i / Math.max(allMonths.length - 1, 1)) * (W - P.l - P.r)} y={H - 5} class="tick" text-anchor="middle">{fmtMonth(ym).split(" ")[0]}</text>
            {/if}
          {/each}
        </svg>
      </div>
    {/each}
  </div>

  <SessionIndex {data} />
  <footer>CLIMBLOG — OPTION A. GRADES STAY HOME: EVERY VENUE IS ITS OWN LEDGER.</footer>
</div>

<style>
  .opt {
    background: #fff; color: #000; min-height: 100vh;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 1180px; margin: 0 auto; padding: 28px 32px 80px; font-size: 13px;
  }
  .cap { display: flex; align-items: baseline; gap: 16px; margin: 40px 0 10px; }
  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 600; margin: 0; }

  .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .panel { border: 1px solid #000; }
  .phead { display: flex; align-items: baseline; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #000; }
  .pname { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
  .pstats { font-size: 9px; letter-spacing: 0.1em; color: #888; }
  .chart { width: 100%; height: auto; display: block; }
  .grid { stroke: #ececec; stroke-width: 1; }
  .steps { fill: none; stroke: #000; stroke-width: 1.6; }
  .dot { fill: #000; }
  .tick { font-size: 8px; letter-spacing: 0.06em; fill: #888; font-family: ui-monospace, Menlo, monospace; }

  footer { margin-top: 60px; padding-top: 10px; border-top: 1px solid #000; font-size: 9.5px; letter-spacing: 0.14em; color: #888; }
  @media (max-width: 800px) { .panels { grid-template-columns: 1fr; } }
</style>
