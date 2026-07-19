<script>
  // OPTION B — EFFORT & EFFICIENCY: grade-free strength signals.
  // Attempts-per-send, flash rate, first-send share, and ACWR load ratio.
  import Masthead from "./Masthead.svelte";
  import Fig1 from "./Fig1.svelte";
  import SessionIndex from "./SessionIndex.svelte";
  import { monthlyEffort, acwr, fmtMonth } from "./derive.js";

  let { data } = $props();

  const effort = $derived(monthlyEffort(data));
  const load = $derived(acwr(data));

  const W = 350, H = 160, P = { l: 30, r: 8, t: 12, b: 20 };
  function lineOf(values, max) {
    const pts = values.map((v, i) => ({ i, v })).filter((p) => p.v !== null);
    const xs = (i) => P.l + (i / Math.max(values.length - 1, 1)) * (W - P.l - P.r);
    const ys = (v) => H - P.b - (v / max) * (H - P.t - P.b);
    return pts.map((p, k) => `${k ? "L" : "M"}${xs(p.i).toFixed(1)},${ys(p.v).toFixed(1)}`).join("");
  }

  const apsMax = $derived(Math.max(...effort.map((e) => e.attemptsPerSend ?? 0), 1) * 1.15);
  const apsPath = $derived(lineOf(effort.map((e) => e.attemptsPerSend), apsMax));
  const flashPath = $derived(lineOf(effort.map((e) => e.flashRate), 1));
  const firstPath = $derived(lineOf(effort.map((e) => e.firstShare), 1));

  // ACWR chart
  const AW = 1100, AH = 190, AP = { l: 34, r: 8, t: 10, b: 20 };
  const ratioMax = 2;
  const ax = (i) => AP.l + (i / Math.max(load.length - 1, 1)) * (AW - AP.l - AP.r);
  const ay = (r) => AH - AP.b - (Math.min(r, ratioMax) / ratioMax) * (AH - AP.t - AP.b);
  const acwrPath = $derived(
    load.map((w, i) => ({ i, r: w.ratio })).filter((p) => p.r !== null)
      .map((p, k) => `${k ? "L" : "M"}${ax(p.i).toFixed(1)},${ay(p.r).toFixed(1)}`).join(""),
  );
  const spikes = $derived(load.filter((w) => w.ratio !== null && w.ratio > 1.5));
</script>

<div class="opt">
  <Masthead {data} sub="OPTION B — EFFORT & EFFICIENCY — AUG 2025 / JUL 2026" active="v2" />
  <Fig1 {data} />

  <div class="row3">
    <section>
      <div class="cap"><h2>FIG. 2 — ATTEMPTS PER SEND</h2><span class="legend">LOWER = STRONGER</span></div>
      <svg viewBox="0 0 {W} {H}" class="chart">
        {#each [0, 0.5, 1] as g (g)}
          <line x1={P.l} x2={W - P.r} y1={H - P.b - g * (H - P.t - P.b)} y2={H - P.b - g * (H - P.t - P.b)} class="grid" />
        {/each}
        <path d={apsPath} class="line" />
        <text x={P.l - 5} y={P.t + 6} class="tick" text-anchor="end">{apsMax.toFixed(1)}</text>
        <text x={P.l - 5} y={H - P.b + 3} class="tick" text-anchor="end">0</text>
        {#each effort as e, i (e.month)}
          {#if i % 2 === 0}<text x={P.l + (i / Math.max(effort.length - 1, 1)) * (W - P.l - P.r)} y={H - 5} class="tick" text-anchor="middle">{fmtMonth(e.month).split(" ")[0]}</text>{/if}
        {/each}
      </svg>
    </section>

    <section>
      <div class="cap"><h2>FIG. 3 — FLASH RATE</h2><span class="legend">SENT FIRST TRY / ALL SENDS</span></div>
      <svg viewBox="0 0 {W} {H}" class="chart">
        {#each [0, 0.5, 1] as g (g)}
          <line x1={P.l} x2={W - P.r} y1={H - P.b - g * (H - P.t - P.b)} y2={H - P.b - g * (H - P.t - P.b)} class="grid" />
          <text x={P.l - 5} y={H - P.b - g * (H - P.t - P.b) + 3} class="tick" text-anchor="end">{g * 100}%</text>
        {/each}
        <path d={flashPath} class="line" />
        {#each effort as e, i (e.month)}
          {#if i % 2 === 0}<text x={P.l + (i / Math.max(effort.length - 1, 1)) * (W - P.l - P.r)} y={H - 5} class="tick" text-anchor="middle">{fmtMonth(e.month).split(" ")[0]}</text>{/if}
        {/each}
      </svg>
    </section>

    <section>
      <div class="cap"><h2>FIG. 4 — FIRST-SEND SHARE</h2><span class="legend">NEW PROBLEMS / ALL SENDS</span></div>
      <svg viewBox="0 0 {W} {H}" class="chart">
        {#each [0, 0.5, 1] as g (g)}
          <line x1={P.l} x2={W - P.r} y1={H - P.b - g * (H - P.t - P.b)} y2={H - P.b - g * (H - P.t - P.b)} class="grid" />
          <text x={P.l - 5} y={H - P.b - g * (H - P.t - P.b) + 3} class="tick" text-anchor="end">{g * 100}%</text>
        {/each}
        <path d={firstPath} class="line" />
        {#each effort as e, i (e.month)}
          {#if i % 2 === 0}<text x={P.l + (i / Math.max(effort.length - 1, 1)) * (W - P.l - P.r)} y={H - 5} class="tick" text-anchor="middle">{fmtMonth(e.month).split(" ")[0]}</text>{/if}
        {/each}
      </svg>
    </section>
  </div>

  <section>
    <div class="cap"><h2>FIG. 5 — ACUTE : CHRONIC WORKLOAD RATIO (WEEKLY ATTEMPTS ÷ 4-WEEK MEAN)</h2>
      <span class="legend">SHADED = 0.8–1.3 SWEET SPOT · — — 1.5 SPIKE LINE · ▲ SPIKE WEEKS</span></div>
    <svg viewBox="0 0 {AW} {AH}" class="chart">
      <rect x={AP.l} y={ay(1.3)} width={AW - AP.l - AP.r} height={ay(0.8) - ay(1.3)} class="band" />
      {#each [0, 0.5, 1, 1.5, 2] as g (g)}
        <line x1={AP.l} x2={AW - AP.r} y1={ay(g)} y2={ay(g)} class="grid" class:danger={g === 1.5} />
        <text x={AP.l - 6} y={ay(g) + 3} class="tick" text-anchor="end">{g.toFixed(1)}</text>
      {/each}
      <path d={acwrPath} class="line" />
      {#each spikes as s (s.week)}
        <path d={`M${ax(load.indexOf(s))},${ay(s.ratio) - 8}l4,7h-8z`} class="spike" />
      {/each}
    </svg>
  </section>

  <SessionIndex {data} />
  <footer>CLIMBLOG — OPTION B. STRENGTH WITHOUT GRADES: EFFORT, EFFICIENCY, LOAD.</footer>
</div>

<style>
  .opt {
    background: #fff; color: #000; min-height: 100vh;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 1180px; margin: 0 auto; padding: 28px 32px 80px; font-size: 13px;
  }
  .cap { display: flex; align-items: baseline; gap: 16px; margin: 40px 0 10px; }
  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 600; margin: 0; }
  .legend { font-size: 9px; letter-spacing: 0.1em; color: #888; }
  .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 28px; align-items: start; }
  .chart { width: 100%; height: auto; display: block; border: 1px solid #000; }
  .grid { stroke: #ececec; stroke-width: 1; }
  .grid.danger { stroke: #000; stroke-dasharray: 5 4; }
  .band { fill: #f2f2f2; }
  .line { fill: none; stroke: #000; stroke-width: 1.5; }
  .spike { fill: #000; }
  .tick { font-size: 8px; letter-spacing: 0.06em; fill: #888; font-family: ui-monospace, Menlo, monospace; }
  footer { margin-top: 60px; padding-top: 10px; border-top: 1px solid #000; font-size: 9.5px; letter-spacing: 0.14em; color: #888; }
  @media (max-width: 900px) { .row3 { grid-template-columns: 1fr; } }
</style>
