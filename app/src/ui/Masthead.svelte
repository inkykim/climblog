<script>
  import { totals, byDay, dateSpan, fmtMonth } from "./derive.js";

  let { data, aboutOpen = $bindable(false), demo = false } = $props();

  const t = $derived(totals(data));
  const days = $derived(byDay(data));
  const span = $derived(dateSpan(data));

  const sub = $derived.by(() => {
    if (!span) return "TRAINING ARCHIVE";
    const f = fmtMonth(span.first.slice(0, 7)).replace(" ", " 20");
    const l = fmtMonth(span.last.slice(0, 7)).replace(" ", " 20");
    return `TRAINING ARCHIVE — ${f === l ? f : `${f} / ${l}`}${demo ? " — DEMO DATA" : ""}`;
  });

  const strip = $derived.by(() => {
    if (!span) return [];
    const out = [];
    for (let ts = span.a; ts <= span.b; ts += 86400000) {
      const key = new Date(ts).toISOString().slice(0, 10);
      out.push({ date: key, kind: days.get(key)?.kind ?? "none" });
    }
    return out;
  });
  const num = (n) => n.toLocaleString("en-US");
</script>

<header class="mast">
  <div class="masthead">
    <span class="brand">CLIMBLOG</span>
    <span class="by">by inky</span>
    <span class="sub">{sub}</span>
    <nav>
      <button class="about" class:on={aboutOpen} onclick={() => (aboutOpen = !aboutOpen)}>
        ABOUT{aboutOpen ? " —" : " +"}
      </button>
    </nav>
  </div>
  <div class="strip" aria-hidden="true">
    {#each strip as d (d.date)}<i class={d.kind}></i>{/each}
  </div>
  <div class="tally">
    <span>{num(t.sessions)} {t.sessions === 1 ? "SESSION" : "SESSIONS"}</span>
    <span>{num(data.gyms?.length ?? 0)} {(data.gyms?.length ?? 0) === 1 ? "GYM" : "GYMS"}</span>
    <span>{num(t.attempts)} {t.attempts === 1 ? "ATTEMPT" : "ATTEMPTS"}</span>
    <span>{num(t.firsts)} {t.firsts === 1 ? "SEND" : "SENDS"}</span>
    <span>{num(Math.round(t.minutes / 60))} {Math.round(t.minutes / 60) === 1 ? "HOUR" : "HOURS"}</span>
  </div>
</header>

<style>
  .masthead { display: flex; align-items: baseline; gap: 18px; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .by { font-size: 12px; font-weight: 700; color: #9a9a9a; margin-left: -8px; }
  .sub { font-size: 10px; letter-spacing: 0.14em; }
  nav { margin-left: auto; }
  .about {
    background: none; border: none; padding: 0; cursor: pointer;
    font-family: inherit; color: #000; font-size: 10px; letter-spacing: 0.14em;
  }
  .about.on, .about:hover { border-bottom: 1px solid #000; }

  .strip { display: flex; width: 100%; height: 26px; border-top: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; }
  .strip i { flex: 1 1 0; }
  .strip i.climb { background: #000; }
  .strip i.workout { background: #b3b3b3; }
  .strip i.rest { background: #eee; }
  .strip i.none { background: #fff; }

  .tally { display: flex; gap: 26px; padding: 10px 0 0; font-size: 10.5px; letter-spacing: 0.12em; flex-wrap: wrap; }

  @media (max-width: 640px) {
    .masthead { flex-wrap: wrap; row-gap: 2px; }
    .brand { font-size: 19px; }
    .sub { order: 4; flex-basis: 100%; font-size: 9px; }
    .tally { gap: 10px 18px; font-size: 9.5px; }
    .strip { height: 20px; }
  }
</style>
