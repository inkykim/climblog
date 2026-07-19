<script>
  import { onMount } from "svelte";
  import Summary from "./lib/Summary.svelte";
  import Timeline from "./lib/Timeline.svelte";
  import InjuryCurve from "./lib/InjuryCurve.svelte";

  let data = $state(null);
  let error = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
      if (!res.ok) throw new Error(`Could not load data.json (HTTP ${res.status})`);
      data = await res.json();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  const activeInjuries = $derived(
    data ? data.injuries.filter((i) => i.status === "active") : [],
  );
  const resolvedInjuries = $derived(
    data ? data.injuries.filter((i) => i.status === "resolved") : [],
  );
  const hasAnything = $derived(
    !!(
      data &&
      (data.loadEvents.length ||
        data.symptomObservations.length ||
        data.injuries.length)
    ),
  );
</script>

<header>
  <h1>climb<span>log</span></h1>
  <p class="tagline">training &amp; injury journal</p>
</header>

<main>
  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <div class="card error">
      <strong>Couldn't load data.</strong>
      <p class="muted small">{error}</p>
    </div>
  {:else if !hasAnything}
    <div class="card empty">
      <h2>No entries yet</h2>
      <p>
        Log your first entry by copying a template from <code>codebook.md</code>
        into <code>entries/</code> and committing it. Even a one-line
        <code>type: rest</code> day counts.
      </p>
    </div>
  {:else}
    <Summary {data} />

    <section>
      <h2>Injuries</h2>
      {#if activeInjuries.length === 0 && resolvedInjuries.length === 0}
        <p class="muted">No injuries tracked. 🎉</p>
      {:else}
        {#each activeInjuries as injury (injury.id)}
          <InjuryCurve {injury} observations={data.symptomObservations} active />
        {/each}
        {#each resolvedInjuries as injury (injury.id)}
          <InjuryCurve {injury} observations={data.symptomObservations} />
        {/each}
      {/if}
    </section>

    <section>
      <h2>Timeline</h2>
      <Timeline events={data.loadEvents} />
    </section>
  {/if}
</main>

<footer>
  <p class="muted small">
    Read-only view · data lives in the repo{data?.generatedAt
      ? ` · built ${data.generatedAt.slice(0, 10)}`
      : ""}
  </p>
</footer>
