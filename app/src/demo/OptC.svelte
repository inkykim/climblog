<script>
  // OPTION C — INJURY LAB: the research angle. Recovery curves aligned to
  // onset, prior-day load vs pain dose-response, tolerance strips.
  import Masthead from "./Masthead.svelte";
  import Fig1 from "./Fig1.svelte";
  import SessionIndex from "./SessionIndex.svelte";
  import { alignedRecovery, loadPainLag, obsFor } from "./derive.js";

  let { data } = $props();

  const recovery = $derived(alignedRecovery(data));
  const lag = $derived(loadPainLag(data));

  const DASH = ["", "6 4", "2 3"]; // per-injury line styles in B&W

  // FIG 2: aligned recovery
  const RW = 540, RH = 200, RP = { l: 30, r: 10, t: 12, b: 22 };
  const maxDay = $derived(Math.max(...recovery.flatMap((r) => r.points.map((p) => p.day)), 1));
  const rx = (d) => RP.l + (d / maxDay) * (RW - RP.l - RP.r);
  const ry = (p) => RH - RP.b - (p / 10) * (RH - RP.t - RP.b);
  const rpath = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${rx(p.day).toFixed(1)},${ry(p.pain).toFixed(1)}`).join("");

  // FIG 3: load → next-day pain scatter
  const SW = 540, SH = 200, SP = { l: 30, r: 10, t: 12, b: 22 };
  const maxLoad = $derived(Math.max(...lag.flatMap((l) => l.points.map((p) => p.load)), 1));
  const sx = (l) => SP.l + (l / maxLoad) * (SW - SP.l - SP.r);
  const sy = (p) => SH - SP.b - (p / 10) * (SH - SP.t - SP.b);

  // FIG 4: tolerance strips over the year
  const span = $derived.by(() => {
    const dates = data.loadEvents.map((e) => e.date).sort();
    return { a: new Date(`${dates[0]}T00:00:00`).getTime(), b: new Date(`${dates[dates.length - 1]}T00:00:00`).getTime() };
  });
  const tolX = (dateStr) => ((new Date(`${dateStr}T00:00:00`).getTime() - span.a) / (span.b - span.a)) * 100;
  const TONE = { green: "#e2e2e2", yellow: "#8f8f8f", red: "#000" };
</script>

<div class="opt">
  <Masthead {data} sub="OPTION C — INJURY LAB — AUG 2025 / JUL 2026" active="v3" />
  <Fig1 {data} />

  <div class="duo">
    <section>
      <div class="cap"><h2>FIG. 2 — RECOVERY CURVES, ALIGNED TO ONSET</h2><span class="legend">X = DAYS SINCE INJURY</span></div>
      <svg viewBox="0 0 {RW} {RH}" class="chart">
        {#each [0, 2, 4, 6, 8, 10] as g (g)}
          <line x1={RP.l} x2={RW - RP.r} y1={ry(g)} y2={ry(g)} class="grid" />
          <text x={RP.l - 5} y={ry(g) + 3} class="tick" text-anchor="end">{g}</text>
        {/each}
        {#each recovery as r, i (r.injury.id)}
          <path d={rpath(r.points)} class="line" stroke-dasharray={DASH[i % DASH.length]} />
        {/each}
        {#each [0, Math.round(maxDay / 2), maxDay] as d (d)}
          <text x={rx(d)} y={RH - 6} class="tick" text-anchor="middle">D+{d}</text>
        {/each}
      </svg>
      <div class="keys">
        {#each recovery as r, i (r.injury.id)}
          <span class="key"><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" class="line" stroke-dasharray={DASH[i % DASH.length]} /></svg>{r.injury.label?.toUpperCase()}</span>
        {/each}
      </div>
    </section>

    <section>
      <div class="cap"><h2>FIG. 3 — PRIOR-DAY LOAD × PAIN</h2><span class="legend">X = ATTEMPTS DAY BEFORE READING</span></div>
      <svg viewBox="0 0 {SW} {SH}" class="chart">
        {#each [0, 2, 4, 6, 8, 10] as g (g)}
          <line x1={SP.l} x2={SW - SP.r} y1={sy(g)} y2={sy(g)} class="grid" />
          <text x={SP.l - 5} y={sy(g) + 3} class="tick" text-anchor="end">{g}</text>
        {/each}
        {#each lag as l, i (l.injury.id)}
          {#each l.points as p, k (k)}
            {#if i === 0}<rect x={sx(p.load) - 2.5} y={sy(p.pain) - 2.5} width="5" height="5" class="m-fill" />
            {:else if i === 1}<circle cx={sx(p.load)} cy={sy(p.pain)} r="3" class="m-hollow" />
            {:else}<path d={`M${sx(p.load) - 3},${sy(p.pain) - 3}l6,6M${sx(p.load) + 3},${sy(p.pain) - 3}l-6,6`} class="m-cross" />{/if}
          {/each}
        {/each}
        <text x={SP.l} y={SH - 6} class="tick">0</text>
        <text x={SW - SP.r} y={SH - 6} class="tick" text-anchor="end">{maxLoad} ATTEMPTS</text>
      </svg>
      <div class="keys">
        {#each lag as l, i (l.injury.id)}
          <span class="key">
            {#if i === 0}<svg width="10" height="10"><rect x="2" y="2" width="5" height="5" class="m-fill" /></svg>
            {:else if i === 1}<svg width="10" height="10"><circle cx="5" cy="5" r="3" class="m-hollow" /></svg>
            {:else}<svg width="10" height="10"><path d="M2,2l6,6M8,2l-6,6" class="m-cross" /></svg>{/if}
            {l.injury.label?.toUpperCase()}
          </span>
        {/each}
      </div>
    </section>
  </div>

  <section>
    <div class="cap"><h2>FIG. 4 — LOAD TOLERANCE, DAY BY DAY</h2><span class="legend">▮ RED · ▮ YELLOW · ▯ GREEN</span></div>
    <div class="strips">
      {#each data.injuries as inj (inj.id)}
        <div class="striprow">
          <span class="sl">{inj.label?.toUpperCase()}</span>
          <div class="track">
            {#each obsFor(data, inj.id) as o (o.id)}
              <i style="left:{tolX(o.date).toFixed(2)}%;background:{TONE[o.load_tolerance] ?? '#ccc'}"></i>
            {/each}
          </div>
          <span class="ss">{inj.status === "active" ? "ACTIVE" : "RESOLVED"}</span>
        </div>
      {/each}
    </div>
  </section>

  <SessionIndex {data} />
  <footer>CLIMBLOG — OPTION C. THE JOURNAL AS A DATASET: DOSE, RESPONSE, RECOVERY.</footer>
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
  .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
  .chart { width: 100%; height: auto; display: block; border: 1px solid #000; }
  .grid { stroke: #ececec; stroke-width: 1; }
  .line { fill: none; stroke: #000; stroke-width: 1.4; }
  .tick { font-size: 8px; letter-spacing: 0.06em; fill: #888; font-family: ui-monospace, Menlo, monospace; }
  .m-fill { fill: #000; }
  .m-hollow { fill: none; stroke: #000; stroke-width: 1.2; }
  .m-cross { stroke: #000; stroke-width: 1.2; fill: none; }
  .keys { display: flex; gap: 18px; padding: 8px 2px; flex-wrap: wrap; }
  .key { display: inline-flex; align-items: center; gap: 6px; font-size: 8.5px; letter-spacing: 0.1em; }

  .strips { border-top: 1px solid #000; }
  .striprow { display: grid; grid-template-columns: 250px 1fr 80px; align-items: center; gap: 16px; border-bottom: 1px solid #e3e3e3; padding: 12px 0; }
  .sl { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .track { position: relative; height: 16px; background: #f7f7f7; }
  .track i { position: absolute; top: 0; bottom: 0; width: 4px; }
  .ss { font-size: 9px; letter-spacing: 0.14em; text-align: right; }

  footer { margin-top: 60px; padding-top: 10px; border-top: 1px solid #000; font-size: 9.5px; letter-spacing: 0.14em; color: #888; }
  @media (max-width: 900px) { .duo { grid-template-columns: 1fr; } }
</style>
