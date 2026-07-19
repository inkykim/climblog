<script>
  import { totals, byDay } from "./derive.js";

  let { data, sub, active } = $props();

  const t = $derived(totals(data));
  const days = $derived(byDay(data));

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
  const num = (n) => n.toLocaleString("en-US");
</script>

<header class="mast">
  <div class="masthead">
    <span class="brand">CLIMBLOG</span>
    <span class="sub">{sub}</span>
    <nav>
      <a href="#v1" class:on={active === "v1"}>A</a>
      <a href="#v2" class:on={active === "v2"}>B</a>
      <a href="#v3" class:on={active === "v3"}>C</a>
    </nav>
  </div>
  <div class="strip" aria-hidden="true">
    {#each strip as d (d.date)}<i class={d.kind}></i>{/each}
  </div>
  <div class="tally">
    <span>{num(t.sessions)} SESSIONS</span>
    <span>{num(t.climbs)} CLIMBS</span>
    <span>{num(t.sends)} SENDS</span>
    <span>{num(t.firsts)} FIRST SENDS</span>
    <span>{num(Math.round(t.minutes / 60))} HOURS</span>
  </div>
</header>

<style>
  .mast { display: block; }
  .masthead { display: flex; align-items: baseline; gap: 18px; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .sub { font-size: 10px; letter-spacing: 0.14em; }
  nav { margin-left: auto; display: flex; gap: 12px; }
  nav a { color: #999; text-decoration: none; font-size: 10px; letter-spacing: 0.14em; }
  nav a.on { color: #000; border-bottom: 1px solid #000; }

  .strip { display: flex; width: 100%; height: 26px; border-top: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; }
  .strip i { flex: 1 1 0; }
  .strip i.climb { background: #000; }
  .strip i.workout { background: #b3b3b3; }
  .strip i.rest { background: #eee; }
  .strip i.none { background: #fff; }

  .tally { display: flex; gap: 26px; padding: 10px 0 0; font-size: 10.5px; letter-spacing: 0.12em; }
</style>
