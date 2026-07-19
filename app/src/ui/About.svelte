<script>
  // Content lives in app/src/about.md — edit that file, not this one.
  import raw from "../about.md?raw";
  const paragraphs = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
</script>

<section class="about">
  <h2>ABOUT</h2>
  {#each paragraphs as p, i (i)}
    <p>{p}</p>
  {/each}
</section>

<style>
  .about { border-bottom: 1px solid #000; padding: 8px 0 28px; }
  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 600; margin: 32px 0 12px; }
  p { margin: 0 0 12px; font-size: 14px; line-height: 1.65; max-width: 640px; }
</style>
