<script>
  let { events } = $props();

  const sorted = $derived([...events].sort((a, b) => b.date.localeCompare(a.date)));

  const typeLabel = {
    climbing_session: "Climbing",
    rest_workout: "Rest-day workout",
    rest: "Rest",
    nothing: "Nothing",
  };
  const typeClass = {
    climbing_session: "climb",
    rest_workout: "workout",
    rest: "rest",
    nothing: "nothing",
  };
  const discLabel = {
    gym: "gym",
    kilter_board: "Kilter Board",
    tb2: "Tension Board 2",
    outdoor: "outdoor",
  };

  // Session aggregates are derived from the climbs array, never stored.
  function vRank(grade) {
    const m = /^V(B|\d{1,2})$/i.exec(grade ?? "");
    if (!m) return null;
    return m[1].toUpperCase() === "B" ? -1 : parseInt(m[1], 10);
  }

  function climbSummary(e) {
    const climbs = e.climbs ?? [];
    if (!climbs.length) return null;
    const sends = climbs.filter((c) => c.sent);
    const firstSends = sends.filter((c) => !c.repeat).length;
    let top = null;
    for (const c of sends) {
      const r = vRank(c.grade);
      if (r !== null && (top === null || r > vRank(top))) top = c.grade;
    }
    if (top === null && sends.length) {
      // non-V grading (circuit / kyu-dan): show the last send's grade instead
      top = sends[sends.length - 1].grade;
    }
    const s = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const parts = [s(climbs.length, "climb"), s(sends.length, "send")];
    if (firstSends) parts.push(`${firstSends} first`);
    if (top) parts.push(`top ${top}`);
    return parts.join(" · ");
  }
</script>

{#if sorted.length === 0}
  <p class="muted">No sessions logged yet.</p>
{:else}
  <ul class="timeline">
    {#each sorted as e (e.id)}
      <li>
        <span class="date">{e.date}</span>
        <span class="badge {typeClass[e.type] ?? 'nothing'}">
          {typeLabel[e.type] ?? e.type}
        </span>
        <span class="detail">
          {#if e.type === "climbing_session"}
            {e.gym_name ?? discLabel[e.discipline] ?? ""}
            {#if climbSummary(e)}{" · "}{climbSummary(e)}{/if}
          {:else if e.type === "rest_workout"}
            {#if e.workout_type?.length}{e.workout_type.join(", ")}{/if}
          {/if}
          {#if e.duration_min}{" · "}{e.duration_min} min{/if}
          {#if e.rpe}{" · RPE "}{e.rpe}{/if}
        </span>
      </li>
    {/each}
  </ul>
{/if}
