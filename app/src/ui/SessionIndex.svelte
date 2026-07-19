<script>
  import { sessions, sessionStats, venueOf, TYPE_LABEL } from "./derive.js";

  let { data, title = "SESSION INDEX" } = $props();

  const ss = $derived([...sessions(data)].reverse());
  let open = $state(null); // session id whose notes are expanded

  function toggle(id) {
    open = open === id ? null : id;
  }
  function climbLine(c) {
    const bits = [];
    if (c.name) bits.push(c.name);
    bits.push(c.grade?.toUpperCase());
    if (c.board_angle != null) bits.push(`${c.board_angle}°`);
    if (c.wall_angle) bits.push(c.wall_angle);
    bits.push(`×${c.attempts}`);
    if (c.sent) bits.push(c.repeat ? "✓ rpt" : "✓");
    return bits.join(" ");
  }
</script>

<section class="index">
  <h2>{title}</h2>
  <table>
    <colgroup>
      <col style="width:44px" /><col style="width:104px" /><col />
      <col style="width:96px" /><col style="width:64px" /><col style="width:60px" />
      <col style="width:72px" /><col style="width:52px" />
    </colgroup>
    <thead>
      <tr>
        <th class="mono">NO.</th><th class="mono">DATE</th><th>VENUE</th>
        <th>TYPE</th><th class="r">CLIMBS</th><th class="r">SENDS</th>
        <th class="r">TOP</th><th class="r">MIN</th>
      </tr>
    </thead>
    <tbody>
      {#if ss.length === 0}
        <tr class="empty-row"><td colspan="8" class="empty">NO SESSIONS YET.</td></tr>
      {/if}
      {#each ss as e, i (e.id)}
        {@const s = sessionStats(e)}
        {@const hasDetail = !!(e._notes || e.climbs?.length)}
        <tr class="row" class:openrow={open === e.id} onclick={() => hasDetail && toggle(e.id)}>
          <td class="mono dim c-no">{String(ss.length - i).padStart(3, "0")}</td>
          <td class="mono c-date">{e.date}</td>
          <td class="venue c-venue">{venueOf(e).toUpperCase()}</td>
          <td class="dim c-type">{TYPE_LABEL[e.discipline]?.toUpperCase()}</td>
          <td class="r mono c-climbs">{s.climbs}</td>
          <td class="r mono c-sends">{s.sends}</td>
          <td class="r mono top c-top">{s.top?.toUpperCase() ?? "—"}</td>
          <td class="r mono dim c-min">{e.duration_min ?? "—"}</td>
        </tr>
        {#if open === e.id}
          <tr class="detail">
            <td></td>
            <td colspan="7">
              {#if e._notes}<p class="notes">{e._notes}</p>{/if}
              {#if e.climbs?.length}
                <p class="climbs mono">
                  {#each e.climbs as c, ci (ci)}<span class="chip" class:sent={c.sent}>{climbLine(c)}</span>{/each}
                </p>
              {/if}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</section>

<style>
  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 500; margin: 40px 0 8px; }
  /* fixed layout: the expanded detail row (colspan) can no longer shift column widths */
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td { overflow-wrap: break-word; }
  th { text-align: left; font-weight: 500; font-size: 9.5px; letter-spacing: 0.12em; color: #888; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px 6px 0; }
  th.r { text-align: right; }
  th.c { text-align: center; }
  td { border-bottom: 1px solid #e3e3e3; padding: 5px 8px 5px 0; vertical-align: middle; }
  .r { text-align: right; }
  .c { text-align: center; }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11.5px; }
  .dim { color: #888; }
  .row { cursor: pointer; }
  .row:hover { background: #000; color: #fff; }
  .row:hover .dim { color: #aaa; }
  .row.openrow { background: #000; color: #fff; }
  .row.openrow .dim { color: #aaa; }
  .venue { font-weight: 600; letter-spacing: 0.02em; }
  .top { font-weight: 600; }
  .empty { text-align: center; padding: 28px 0; font-size: 10px; letter-spacing: 0.16em; color: #888; }

  .detail td { border-bottom: 1px solid #000; background: #fafafa; padding: 12px 16px 14px 0; }
  .notes { margin: 0 0 8px; font-size: 13px; line-height: 1.5; max-width: 640px; }
  .climbs { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border: 1px solid #ccc; padding: 2px 8px; font-size: 10px; color: #888; white-space: nowrap; }
  .chip.sent { border-color: #000; color: #000; }

  /* ---- mobile: each row becomes two lines (date · venue · top / meta) ---- */
  @media (max-width: 640px) {
    table, tbody { display: block; }
    colgroup { display: none; }
    thead { display: none; }
    tbody { border-top: 1px solid #000; }
    tr.row {
      display: grid;
      grid-template-columns: max-content max-content max-content 1fr max-content;
      column-gap: 12px;
      row-gap: 3px;
      padding: 9px 0;
      border-bottom: 1px solid #e3e3e3;
    }
    tr.row td { border: none; padding: 0; }
    .c-no { display: none; }
    .c-date { grid-row: 1; grid-column: 1; }
    .c-venue {
      grid-row: 1; grid-column: 2 / span 3;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .c-top { grid-row: 1; grid-column: 5; text-align: right; }
    .c-type { grid-row: 2; grid-column: 1; font-size: 10px; letter-spacing: 0.08em; }
    .c-climbs { grid-row: 2; grid-column: 2; text-align: left; font-size: 10.5px; color: #888; }
    .c-sends { grid-row: 2; grid-column: 3; text-align: left; font-size: 10.5px; color: #888; }
    .c-min { grid-row: 2; grid-column: 5; text-align: right; font-size: 10.5px; }
    .c-climbs::after { content: " climbs"; }
    .c-sends::after { content: " sends"; }
    .c-min::after { content: " min"; }

    tr.detail { display: block; border-bottom: 1px solid #000; }
    tr.detail td:first-child { display: none; }
    tr.detail td { display: block; padding: 10px 0 12px; }
    tr.empty-row { display: block; }
  }
</style>
