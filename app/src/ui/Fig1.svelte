<script>
  import { weeklyLoad, obsFor, byMonth, fmtMonth, dateSpan } from "./derive.js";

  let { data, label = "FIG. 1 — TRAINING LOAD × INJURY PAIN" } = $props();

  const weeks = $derived(weeklyLoad(data));
  const months = $derived(byMonth(data));
  const span = $derived(dateSpan(data));

  const W = 1100, H = 240, PAD = { l: 34, r: 8, t: 12, b: 22 };
  const X = (dateStr) => {
    if (!span) return PAD.l;
    const denom = Math.max(span.b - span.a, 1);
    return PAD.l + ((new Date(`${dateStr}T00:00:00`).getTime() - span.a) / denom) * (W - PAD.l - PAD.r);
  };

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
    loadPath && weeks.length > 1
      ? `${loadPath}L${X(weeks[weeks.length - 1].week).toFixed(1)},${H - PAD.b}L${X(weeks[0].week).toFixed(1)},${H - PAD.b}Z`
      : "",
  );
  const painY = (pain) => H - PAD.b - (pain / 10) * (H - PAD.t - PAD.b);
  function painPath(injId) {
    const obs = obsFor(data, injId);
    return obs.map((o, i) => `${i ? "L" : "M"}${X(o.date).toFixed(1)},${painY(o.pain).toFixed(1)}`).join("");
  }

  // Provenance divider: retrospective Kaya-backfilled era vs live logging.
  const kayaBoundary = $derived.by(() => {
    const kaya = data.loadEvents.filter((e) => e.source === "kaya").map((e) => e.date);
    if (!kaya.length) return null;
    const live = data.loadEvents.filter((e) => !e.source && e.type === "climbing_session").map((e) => e.date);
    const lastKaya = kaya.sort()[kaya.length - 1];
    if (live.length && live.sort()[0] > lastKaya) return live.sort()[0];
    return lastKaya;
  });
</script>

<section>
  <div class="cap">
    <h2>{label}</h2>
    <span class="legend">▮ WEEKLY ATTEMPTS&nbsp;&nbsp;— PAIN 0–10 PER INJURY</span>
  </div>
  {#if !span}
    <div class="chart emptybox">NO DATA YET — LOG SOMETHING TODAY.</div>
  {:else}
    <svg viewBox="0 0 {W} {H}" class="chart">
      {#each [0, 0.25, 0.5, 0.75, 1] as g (g)}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b - g * (H - PAD.t - PAD.b)} y2={H - PAD.b - g * (H - PAD.t - PAD.b)} class="grid" />
      {/each}
      <path d={loadArea} class="area" />
      <path d={loadPath} class="loadline" />
      {#each data.injuries as inj (inj.id)}
        <path d={painPath(inj.id)} class="pain" />
        {#each obsFor(data, inj.id) as o (o.id)}
          <rect x={X(o.date) - 1.7} y={painY(o.pain) - 1.7} width="3.4" height="3.4" class="obsdot" />
        {/each}
      {/each}
      {#each data.injuries as inj (inj.id)}
        {@const first = obsFor(data, inj.id)[0]}
        {#if first}
          {@const ax = X(first.date)}
          <text x={Math.min(ax, W - 12)} y={painY(first.pain) - 8} class="anno"
            text-anchor={ax > W - 220 ? "end" : "start"}>{inj.label?.toUpperCase()}</text>
        {/if}
      {/each}
      {#if kayaBoundary}
        {@const bx = X(kayaBoundary)}
        <line x1={bx} x2={bx} y1={PAD.t} y2={H - PAD.b} class="divider" />
        <text x={bx - 5} y={PAD.t + 8} class="tick" text-anchor="end">RETROSPECTIVE</text>
        <text x={bx + 5} y={PAD.t + 8} class="tick">LIVE</text>
      {/if}
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} class="axis" />
      <text x={PAD.l - 6} y={PAD.t + 8} class="tick" text-anchor="end">{weeks.length ? maxAttempts : 10}</text>
      <text x={PAD.l - 6} y={H - PAD.b} class="tick" text-anchor="end">0</text>
      {#each months as [ym] (ym)}
        <text x={X(ym + "-15")} y={H - 6} class="tick" text-anchor="middle">{fmtMonth(ym).split(" ")[0]}</text>
      {/each}
    </svg>
  {/if}
</section>

<style>
  .cap { display: flex; align-items: baseline; gap: 16px; margin: 40px 0 10px; }
  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 600; margin: 0; }
  .legend { font-size: 9px; letter-spacing: 0.1em; color: #888; }
  .chart { width: 100%; height: auto; display: block; border: 1px solid #000; background: #fff; }
  .emptybox { padding: 60px 0; text-align: center; font-size: 10px; letter-spacing: 0.16em; color: #888; }
  .grid { stroke: #ececec; stroke-width: 1; }
  .axis { stroke: #000; stroke-width: 1; }
  .area { fill: #f0f0f0; stroke: none; }
  .loadline { fill: none; stroke: #9a9a9a; stroke-width: 1; }
  .pain { fill: none; stroke: #000; stroke-width: 1.4; }
  .obsdot { fill: #000; }
  .divider { stroke: #000; stroke-width: 1; stroke-dasharray: 2 4; }
  .tick { font-size: 8.5px; letter-spacing: 0.08em; fill: #888; font-family: ui-monospace, Menlo, monospace; }
  .anno { font-size: 8px; letter-spacing: 0.1em; fill: #000; font-weight: 600; }
</style>
