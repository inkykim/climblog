<script>
  import { renderMarkdown } from "./markdown.js";

  let { data, slug } = $props();
  const post = $derived((data.posts ?? []).find((p) => p.id === slug));
  const html = $derived(post ? renderMarkdown(post._notes ?? "") : "");
  const fmt = (d) => {
    const [y, m, day] = d.split("-");
    return `${["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][+m - 1]} ${+day}, ${y}`;
  };
</script>

<article>
  <a class="back" href="#blog">← BLOG</a>
  {#if !post}
    <p class="missing">POST NOT FOUND.</p>
  {:else}
    <h1>{post.title.toUpperCase()}</h1>
    <p class="meta">
      {fmt(post.date)}{post.injury_label ? ` · RE: ${post.injury_label.toUpperCase()}` : ""}
    </p>
    <div class="body">{@html html}</div>
  {/if}
</article>

<style>
  article { max-width: 640px; margin: 0 auto; padding-top: 34px; }
  .back { display: inline-block; font-size: 10px; letter-spacing: 0.14em; color: #888; text-decoration: none; margin-bottom: 26px; }
  .back:hover { color: #000; }
  .missing { font-size: 10px; letter-spacing: 0.16em; color: #888; text-align: center; padding: 60px 0; }

  h1 { font-size: 30px; font-weight: 750; letter-spacing: -0.01em; line-height: 1.15; margin: 0 0 10px; }
  .meta { font-size: 10px; letter-spacing: 0.14em; color: #888; margin: 0 0 26px; padding-bottom: 18px; border-bottom: 1px solid #000; }

  .body { font-size: 15px; line-height: 1.75; }
  .body :global(p) { margin: 0 0 18px; }
  .body :global(h2) { font-size: 11px; letter-spacing: 0.16em; font-weight: 700; text-transform: uppercase; margin: 36px 0 12px; padding-top: 14px; border-top: 1px solid #000; }
  .body :global(h3) { font-size: 14px; font-weight: 700; margin: 26px 0 8px; }
  .body :global(blockquote) { margin: 0 0 18px; padding: 2px 0 2px 18px; border-left: 2px solid #000; font-style: italic; }
  .body :global(ul), .body :global(ol) { margin: 0 0 18px; padding-left: 22px; }
  .body :global(li) { margin-bottom: 6px; }
  .body :global(hr) { border: none; border-top: 1px solid #000; width: 64px; margin: 30px 0; }
  .body :global(img) { max-width: 100%; display: block; margin: 22px 0; }
  .body :global(code) { font-family: ui-monospace, Menlo, monospace; font-size: 0.88em; background: #f0f0f0; padding: 1px 5px; }
  .body :global(a) { color: #000; text-decoration: underline; text-underline-offset: 2px; }
  .body :global(strong) { font-weight: 700; }

  @media (max-width: 640px) {
    article { padding-top: 22px; }
    h1 { font-size: 24px; }
  }
</style>
