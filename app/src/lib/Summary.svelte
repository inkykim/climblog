<script>
  let { data } = $props();

  function daysAgo(d) {
    if (!d) return null;
    const ms = Date.now() - new Date(`${d}T00:00:00`).getTime();
    return Math.max(0, Math.floor(ms / 86400000));
  }

  const events = $derived(data.loadEvents);
  const lastDate = $derived(
    [...events].sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? null,
  );
  const climbingCount = $derived(
    events.filter((e) => e.type === "climbing_session").length,
  );
  const activeInjuries = $derived(
    data.injuries.filter((i) => i.status === "active").length,
  );
  const sinceLast = $derived(lastDate === null ? null : daysAgo(lastDate));
</script>

<div class="stats">
  <div class="stat">
    <span class="num">{events.length}</span>
    <span class="lbl">entries</span>
  </div>
  <div class="stat">
    <span class="num">{climbingCount}</span>
    <span class="lbl">climbing sessions</span>
  </div>
  <div class="stat">
    <span class="num" class:warn={activeInjuries > 0}>{activeInjuries}</span>
    <span class="lbl">active injuries</span>
  </div>
  <div class="stat">
    <span class="num">{sinceLast === null ? "—" : `${sinceLast}d`}</span>
    <span class="lbl">since last log</span>
  </div>
</div>
