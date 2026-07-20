<script>
  import { onMount } from "svelte";
  import Journal from "./ui/Journal.svelte";

  // routes: "" → archive · #blog → post index · #blog/<id> → post · #demo → demo archive
  let hash = $state(typeof location !== "undefined" ? location.hash : "");
  const route = $derived.by(() => {
    if (hash === "#demo") return { view: "archive", demo: true };
    if (hash === "#blog") return { view: "blog", demo: false };
    const m = hash.match(/^#blog\/(.+)$/);
    if (m) return { view: "post", slug: decodeURIComponent(m[1]), demo: false };
    return { view: "archive", demo: false };
  });

  let data = $state(null);
  let error = $state(null);
  let loadedDemo = $state(null); // which file is currently loaded

  async function load(isDemo) {
    if (loadedDemo === isDemo && data) return; // hash change within same dataset
    try {
      error = null;
      data = null;
      const file = isDemo ? "data-demo.json" : "data.json";
      const res = await fetch(`${import.meta.env.BASE_URL}${file}`);
      if (!res.ok) throw new Error(`Could not load ${file} (HTTP ${res.status})`);
      data = await res.json();
      loadedDemo = isDemo;
    } catch (e) {
      error = e.message;
    }
  }

  onMount(() => {
    const onHash = () => {
      hash = location.hash;
      load(location.hash === "#demo");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    load(route.demo);

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
  <Journal {data} {route} />
{:else}
  <p class="err">LOADING…</p>
{/if}

<style>
  .err {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11px; letter-spacing: 0.1em; padding: 48px;
  }
</style>
