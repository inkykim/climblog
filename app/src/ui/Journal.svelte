<script>
  import Masthead from "./Masthead.svelte";
  import About from "./About.svelte";
  import Fig1 from "./Fig1.svelte";
  import SessionIndex from "./SessionIndex.svelte";
  import BlogIndex from "./BlogIndex.svelte";
  import Post from "./Post.svelte";

  let { data, route } = $props();
  let aboutOpen = $state(false);
  const demo = $derived(route.demo ?? false);
</script>

<div class="journal">
  <Masthead {data} {demo} view={route.view} bind:aboutOpen />
  {#if aboutOpen}
    <About />
  {/if}

  {#if route.view === "blog"}
    <BlogIndex {data} />
  {:else if route.view === "post"}
    <Post {data} slug={route.slug} />
  {:else}
    <Fig1 {data} />
    <SessionIndex {data} />
  {/if}

  <footer>CLIMBLOG <span class="by">by inky</span>{demo ? " — DEMO DATA" : ""}</footer>
</div>

<style>
  .journal {
    background: #fff; color: #000; min-height: 100vh;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 1180px; margin: 0 auto; padding: 28px 32px 80px;
    font-size: 13px; line-height: 1.4;
  }
  footer { margin-top: 60px; padding-top: 10px; border-top: 1px solid #000; font-size: 9.5px; letter-spacing: 0.14em; color: #000; font-weight: 700; }
  footer .by { color: #9a9a9a; letter-spacing: 0; text-transform: none; }

  @media (max-width: 640px) {
    .journal { padding: 18px 16px 56px; }
    footer { margin-top: 40px; }
  }
</style>
