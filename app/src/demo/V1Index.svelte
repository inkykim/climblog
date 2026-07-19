<script>
  import {
    sessions, sessionStats, venueOf, totals, byDay, obsFor, DISC_LABEL,
    linePath, normalize,
  } from "./derive.js";

  let { data } = $props();

  const ss = $derived([...sessions(data)].reverse());
  const t = $derived(totals(data));
  const days = $derived(byDay(data));

  // year strip: every day from first to last
  const strip = $derived.by(() => {
    const dates = data.loadEvents.map((e) => e.date).sort();
    const out = [];
    const d = new Date(`${dates[0]}T00:00:00`);
    const end = new Date(`${dates[dates.length - 1]}T00:00:00`);
    for (; d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, kind: days.get(key)?.kind ?? "none" });
    }
    return out;
  });

  function spark(injury) {
    const obs = obsFor(data, injury.id);
    if (!obs.length) return "";
    return linePath(normalize(obs.map((o) => o.pain)).map((p) => ({ x: p.x, y: p.y })), 140, 26);
  }
  const num = (n) => n.toLocaleString("en-US");
</script>

<div class="v1">
  <header>
    <div class="masthead">
      <span class="brand">CLIMBLOG</span>
      <span class="sub">TRAINING ARCHIVE — AUG 2025 / JUL 2026</span>
      <nav><a href="#v1" class="on">V1</a><a href="#v2">V2</a><a href="#v3">V3</a></nav>
    </div>
    <div class="strip" aria-hidden="true">
      {#each strip as d (d.date)}
        <i class={d.kind}></i>
      {/each}
    </div>
    <div class="tally">
      <span>{num(t.sessions)} SESSIONS</span>
      <span>{num(t.climbs)} CLIMBS</span>
      <span>{num(t.sends)} SENDS</span>
      <span>{num(t.firsts)} FIRST SENDS</span>
      <span>TOP {t.top}</span>
      <span>{num(Math.round(t.minutes / 60))} HOURS</span>
    </div>
  </header>

  <section class="injuries">
    <h2>INJURY LEDGER</h2>
    <table>
      <tbody>
        {#each data.injuries as inj (inj.id)}
          {@const obs = obsFor(data, inj.id)}
          <tr>
            <td class="mono">{inj.onset_date}</td>
            <td class="label">{inj.label?.toUpperCase()}</td>
            <td class="mono dim">{inj.site}</td>
            <td class="sparkcell">
              <svg width="140" height="26" viewBox="0 0 140 26"><path d={spark(inj)} /></svg>
            </td>
            <td class="mono dim">{obs.length} OBS</td>
            <td class="istat {inj.status}">{inj.status === "active" ? "● ACTIVE" : `RESOLVED ${inj.resolved_date}`}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="index">
    <h2>SESSION INDEX</h2>
    <table>
      <thead>
        <tr>
          <th class="mono">NO.</th><th class="mono">DATE</th><th>VENUE</th>
          <th>TYPE</th><th class="r">CLIMBS</th><th class="r">SENDS</th>
          <th class="r">TOP</th><th class="r">MIN</th>
        </tr>
      </thead>
      <tbody>
        {#each ss as e, i (e.id)}
          {@const s = sessionStats(e)}
          <tr>
            <td class="mono dim">{String(ss.length - i).padStart(3, "0")}</td>
            <td class="mono">{e.date}</td>
            <td class="venue">{venueOf(e).toUpperCase()}</td>
            <td class="dim">{DISC_LABEL[e.discipline]?.toUpperCase()}</td>
            <td class="r mono">{s.climbs}</td>
            <td class="r mono">{s.sends}</td>
            <td class="r mono top">{s.top ?? "—"}</td>
            <td class="r mono dim">{e.duration_min ?? "—"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <footer>CLIMBLOG — INDEX. DATA: DEMO SET, {data.loadEvents.length} RECORDS.</footer>
</div>

<style>
  .v1 {
    background: #fff; color: #000; min-height: 100vh;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 1180px; margin: 0 auto; padding: 28px 32px 80px;
    font-size: 13px; line-height: 1.4;
  }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11.5px; letter-spacing: 0; }
  .dim { color: #888; }
  .r { text-align: right; }

  .masthead { display: flex; align-items: baseline; gap: 18px; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .sub { font-size: 10px; letter-spacing: 0.14em; color: #000; }
  nav { margin-left: auto; display: flex; gap: 10px; }
  nav a { color: #999; text-decoration: none; font-size: 10px; letter-spacing: 0.14em; }
  nav a.on { color: #000; border-bottom: 1px solid #000; }

  .strip { display: flex; width: 100%; height: 26px; border-top: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; }
  .strip i { flex: 1 1 0; margin: 0; }
  .strip i.climb { background: #000; }
  .strip i.workout { background: #b3b3b3; }
  .strip i.rest { background: #eee; }
  .strip i.none { background: #fff; }

  .tally { display: flex; gap: 26px; padding: 10px 0 0; font-size: 10.5px; letter-spacing: 0.12em; }

  h2 { font-size: 10px; letter-spacing: 0.16em; font-weight: 500; margin: 40px 0 8px; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-weight: 500; font-size: 9.5px; letter-spacing: 0.12em; color: #888; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px 6px 0; }
  th.r { text-align: right; }
  td { border-bottom: 1px solid #e3e3e3; padding: 5px 8px 5px 0; vertical-align: middle; }
  tbody tr:hover { background: #000; color: #fff; }
  tbody tr:hover .dim { color: #aaa; }
  tbody tr:hover .istat.active { color: #fff; }
  tbody tr:hover svg path { stroke: #fff; }
  .venue { font-weight: 600; letter-spacing: 0.02em; }
  .top { font-weight: 600; }
  .label { font-weight: 600; }
  .istat { font-size: 10px; letter-spacing: 0.1em; }
  .istat.active { font-weight: 700; }
  .sparkcell svg { display: block; }
  svg path { fill: none; stroke: #000; stroke-width: 1.25; }

  footer { margin-top: 60px; padding-top: 10px; border-top: 1px solid #000; font-size: 9.5px; letter-spacing: 0.14em; color: #888; }
</style>
