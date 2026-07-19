<script>
  import { onMount } from "svelte";
  import Journal from "./ui/Journal.svelte";

  // #demo → generated demo year (design evaluation); no hash → real data.
  let hash = $state(typeof location !== "undefined" ? location.hash : "");
  const demo = $derived(hash === "#demo");

  let data = $state(null);
  let error = $state(null);

  async function load(isDemo) {
    try {
      error = null;
      data = null;
      const file = isDemo ? "data-demo.json" : "data.json";
      const res = await fetch(`${import.meta.env.BASE_URL}${file}`);
      if (!res.ok) throw new Error(`Could not load ${file} (HTTP ${res.status})`);
      data = await res.json();
    } catch (e) {
      error = e.message;
    }
  }

  onMount(() => {
    const onHash = () => {
      hash = location.hash;
      load(location.hash === "#demo");
    };
    window.addEventListener("hashchange", onHash);
    load(demo);

    // no right-click, no text selection (selection disabled in app.css)
    const noCtx = (e) => e.preventDefault();
    document.addEventListener("contextmenu", noCtx);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("contextmenu", noCtx);
    };
  });
</script>

{#if error}
  <p class="err">COULDN'T LOAD DATA — {error}</p>
{:else if data}
  <Journal {data} {demo} />
{:else}
  <p class="err">LOADING…</p>
{/if}

<style>
  .err {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11px; letter-spacing: 0.1em; padding: 48px;
  }
</style>
