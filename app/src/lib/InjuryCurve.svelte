<script>
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  let { injury, observations, active = false } = $props();

  let canvas = $state();

  const obs = $derived(
    observations
      .filter((o) => o.injury_id === injury.id)
      .sort((a, b) => a.date.localeCompare(b.date)),
  );

  // Stoplight colors for load tolerance, used to color each data point.
  const toneColor = { green: "#16a34a", yellow: "#d97706", red: "#dc2626" };

  onMount(() => {
    if (!obs.length) return;
    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: obs.map((o) => o.date),
        datasets: [
          {
            label: "pain (0–10)",
            data: obs.map((o) => o.pain),
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79,70,229,0.10)",
            tension: 0.25,
            spanGaps: false, // gaps stay gaps — no interpolation over missing days
            pointBackgroundColor: obs.map(
              (o) => toneColor[o.load_tolerance] ?? "#64748b",
            ),
            pointBorderColor: "#fff",
            pointRadius: 5,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 10, ticks: { stepSize: 2 } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) =>
                `load: ${obs[ctx.dataIndex].load_tolerance ?? "—"}`,
            },
          },
        },
      },
    });
    return () => chart.destroy();
  });
</script>

<div class="card injury" class:active>
  <div class="injury-head">
    <div>
      <strong>{injury.label ?? injury.site}</strong>
      <span class="muted small"> · {injury.site}</span>
    </div>
    <span class="status {injury.status}">{injury.status}</span>
  </div>
  <p class="muted small">
    onset {injury.onset_date}{injury.resolved_date
      ? ` · resolved ${injury.resolved_date}`
      : ""} · {obs.length} reading{obs.length === 1 ? "" : "s"}
  </p>
  {#if obs.length}
    <div class="chart-wrap"><canvas bind:this={canvas}></canvas></div>
  {:else}
    <p class="muted small">No readings yet — log how it feels.</p>
  {/if}
</div>
