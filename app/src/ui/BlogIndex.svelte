<script>
  let { data } = $props();
  const posts = $derived(data.posts ?? []);
</script>

<section class="blog">
  <h2>BLOG</h2>
  {#if posts.length === 0}
    <p class="empty">NO POSTS YET — WRITE ONE WITH <code>./post "title"</code></p>
  {:else}
    <table>
      <colgroup><col style="width:44px" /><col style="width:104px" /><col /><col style="width:220px" /></colgroup>
      <thead>
        <tr><th class="mono">NO.</th><th class="mono">DATE</th><th>TITLE</th><th class="re">RE:</th></tr>
      </thead>
      <tbody>
        {#each posts as p, i (p.id)}
          <tr onclick={() => (location.hash = `#blog/${p.id}`)}>
            <td class="mono dim">{String(posts.length - i).padStart(3, "0")}</td>
            <td class="mono">{p.date}</td>
            <td class="title">{p.title.toUpperCase()}</td>
            <td class="re dim">{p.injury_label?.toUpperCase() ?? ""}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 500; margin: 40px 0 8px; }
  .empty { border-top: 1px solid #000; border-bottom: 1px solid #e3e3e3; text-align: center; padding: 34px 0; font-size: 10px; letter-spacing: 0.16em; color: #888; }
  .empty code { background: #f0f0f0; padding: 1px 6px; letter-spacing: 0; text-transform: none; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { text-align: left; font-weight: 500; font-size: 9.5px; letter-spacing: 0.12em; color: #888; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px 6px 0; }
  td { border-bottom: 1px solid #e3e3e3; padding: 8px 8px 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  tbody tr { cursor: pointer; }
  tbody tr:hover { background: #000; color: #fff; }
  tbody tr:hover .dim { color: #aaa; }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11.5px; }
  .dim { color: #888; }
  .title { font-weight: 650; letter-spacing: 0.02em; }
  .re { font-size: 10px; letter-spacing: 0.1em; }

  @media (max-width: 640px) {
    colgroup, thead { display: none; }
    table, tbody { display: block; }
    tbody { border-top: 1px solid #000; }
    tbody tr { display: grid; grid-template-columns: max-content 1fr; column-gap: 12px; row-gap: 2px; padding: 9px 0; border-bottom: 1px solid #e3e3e3; }
    tbody tr td { border: none; padding: 0; white-space: normal; }
    td.mono.dim { display: none; }
    td.mono { grid-row: 1; grid-column: 1; }
    .title { grid-row: 1; grid-column: 2; }
    .re { grid-row: 2; grid-column: 2; }
  }
</style>
