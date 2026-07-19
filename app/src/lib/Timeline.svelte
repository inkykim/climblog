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
            {#if e.disciplines?.length}{e.disciplines.join(", ")}{/if}
            {#if e.volume}{" · "}{e.volume} climbs{/if}
            {#if e.hardest_send}{" · top "}{e.hardest_send}{/if}
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
