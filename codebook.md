# Climblog codebook

The **schemas in `schema/` are canonical** — CI validates every entry against them.
This file is the human-readable mirror: the allowed values, plus copy-paste templates
so you can log by hand without opening the JSON. (The `./log` CLI generates all of
this for you — hand-logging is the fallback.)

Every record is one markdown file with YAML frontmatter. The frontmatter is the data;
anything below the closing `---` is freeform notes (ignored by validation).

## Filenames & ids

- Load events → `entries/load-events/<date>--<shortid>.md`
- Symptom observations → `entries/symptom-observations/<date>--<shortid>.md`
- Injuries → `injuries/<slug>--<shortid>.md`
- Gyms → `gyms/<slug>--<shortid>.md`

`<shortid>` is any 2–8 lowercase-alphanumeric tag (the CLI generates 4 random chars).
**The `id:` in the frontmatter must equal the filename without `.md`.** Dates are
`YYYY-MM-DD` and do **not** need quotes.

---

## Record type: load event

One per training day — a climbing session, a rest-day workout, or a minimal rest/nothing
day. Log *something* every day. A gym day and a board day are **two sessions** (two files).

**Session fields** (`id`, `type`, `date` always required; `discipline` required for
climbing sessions; `gym_id` required when `discipline: gym`):

| field | values |
|---|---|
| `type` | `climbing_session` · `rest_workout` · `rest` · `nothing` |
| `date` | `YYYY-MM-DD` |
| `discipline` | `gym` · `kilter_board` · `tb2` · `outdoor` |
| `gym_id` | id of a gym in `gyms/` (gym sessions) |
| `location` | free text (e.g. outdoor crag), optional |
| `source` | absent = logged live · `kaya` = backfilled from the Kaya app |
| `duration_min` | integer minutes |
| `climbs` | list of per-climb objects — see below |
| `workout_type` | rest_workout only: list of `lifting` · `mobility` · `antagonist` · `cardio` · `hangboard` · `stretching` · `other` |
| `rpe` | rest_workout only: integer 1–10 |
| `notes` | free text |

**Per-climb fields** (`grade`, `attempts`, `sent`, `repeat` required):

| field | values | applies to |
|---|---|---|
| `name` | climb name (boards + outdoor); optional project label on gym climbs to link multi-session projects (e.g. `pink cave dyno`) | boards + outdoor + gym projects |
| `grade` | raw grade in the venue's system: `V5` / `3kyu`, `1dan` / a circuit level defined by the gym | all |
| `wall_angle` | `slab` · `vert` · `overhang` | gym |
| `styles` | list of `crimp` · `pinch` · `slopy` · `dynamic` · `balance` · `coordination` · `power` (a climb can be several) | gym |
| `board_angle` | integer degrees 0–70 | boards |
| `attempts` | integer ≥ 1 | all |
| `attempts_estimated` | `true` when attempts is a backfill convention estimate, not a counted number | backfill |
| `sent` | `true` / `false` | all |
| `repeat` | `true` = sent this problem on a previous day. First send = `sent: true` + `repeat: false`. Asked even when not sent — failing a previously-sent problem is a regression signal. | all |

Session aggregates (volume, hardest send) are **derived from `climbs`, never stored**.

### Template — gym session

```markdown
---
id: 2026-07-19--k3f9
type: climbing_session
date: 2026-07-19
discipline: gym
gym_id: movement-sunnyvale--p7oz
duration_min: 120
climbs:
  - grade: green
    wall_angle: overhang
    styles: [crimp, dynamic]
    attempts: 3
    sent: true
    repeat: false
  - grade: black
    wall_angle: vert
    styles: [slopy]
    attempts: 5
    sent: false
    repeat: false
---
Fun set. Felt strong on the new green circuit.
```

### Template — board session (Kilter / TB2)

```markdown
---
id: 2026-07-20--a1b2
type: climbing_session
date: 2026-07-20
discipline: kilter_board
duration_min: 45
climbs:
  - name: Sleepwalker
    grade: V6
    board_angle: 40
    attempts: 8
    sent: true
    repeat: false
---
```

### Template — outdoor session

```markdown
---
id: 2026-07-21--c3d4
type: climbing_session
date: 2026-07-21
discipline: outdoor
duration_min: 180
climbs:
  - name: Midnight Lightning
    grade: V8
    attempts: 12
    sent: false
    repeat: false
---
```

### Template — rest-day workout

```markdown
---
id: 2026-07-22--e5f6
type: rest_workout
date: 2026-07-22
duration_min: 45
workout_type: [antagonist, mobility]
rpe: 5
---
```

### Template — nothing / full rest day

```markdown
---
id: 2026-07-23--z0z0
type: rest
date: 2026-07-23
---
```

---

## Record type: gym

One file per gym, created automatically the first time you log a session there.
Carries the gym's grading system — this is what future analysis uses to normalize
grades across gyms (soft vs sandbagged) and against boards/outdoor.

**Fields** (`id`, `name`, `grading` required; `circuits` required when `grading: circuit`):

| field | values |
|---|---|
| `grading` | `v_scale` · `kyu_dan` · `circuit` |
| `circuits` | ordered easiest→hardest: list of `{ name, v_min?, v_max? }` |

### Template

```markdown
---
id: movement-sunnyvale--p7oz
name: Movement Sunnyvale
grading: circuit
circuits:
  - name: yellow
    v_min: V0
    v_max: V2
  - name: green
    v_min: V2
    v_max: V4
---
```

Grade formats by system: `v_scale` → `V0`–`V17` (or `VB`); `kyu_dan` → compact form
`8q` … `1q`, then `1d`, `2d` … (the CLI accepts `5kyu`/`5k`/`5q` and `1dan`/`1D`/`1d`
and normalizes); `circuit` → one of that gym's defined level names.

### Normalization anchor (for future analysis)

The **canonical grade scale is defined as exactly midway between TB2 and Kilter**
grading of the same nominal V grade — TB2 runs sandbagged, Kilter runs soft, and the
"true" grade is anchored at their midpoint:

```
standard(Vn) = midpoint( TB2 Vn , Kilter Vn )
```

Everything else normalizes onto that anchor: board sessions provide the calibration
data directly (same climber, same nominal grades, both boards), and each gym's
observed sends — via its `circuits` V-ranges or kyu-dan grades — get mapped relative
to it. This is what makes per-gym soft/sandbag scoring possible later. Nothing about
the anchor is stored per-entry: climbs always store the **raw grade in the venue's
own system**; normalization is purely an analysis-time transform.

---

## Record type: symptom observation

One reading on one injury, on one day. Log the day-of *and* the following days — the
day-after reading is the most informative one.

**Fields** (`id`, `injury_id`, `date`, `pain`, `load_tolerance` required):

| field | values |
|---|---|
| `injury_id` | must match an `id` in `injuries/` |
| `date` | `YYYY-MM-DD` |
| `pain` | integer 0 (none) – 10 (worst) |
| `load_tolerance` | `green` (loads fine) · `yellow` (caution) · `red` (avoid) |
| `rom` | free text range-of-motion note |
| `source` | absent = logged on/near the day · `retrospective` = reconstructed from memory (the CLI sets this automatically on readings dated >7 days back) |
| `notes` | free text |

### Template

```markdown
---
id: 2026-07-19--m2a1
injury_id: a2-left-ring--p8x2
date: 2026-07-19
pain: 3
load_tolerance: yellow
rom: full, mild ache at end range
---
Sore after today's session but no sharp pain.
```

---

## Record type: injury

One file per injury. Symptom observations point at it via `injury_id`.

**Fields** (`id`, `site`, `onset_date`, `status` required):

| field | values |
|---|---|
| `site` | `finger_a2` · `finger_a4` · `finger_pulley_other` · `finger_flexor_tendon` · `elbow_medial` · `elbow_lateral` · `shoulder` · `wrist` · `forearm` · `knee` · `back` · `other` |
| `label` | human name, e.g. `left ring A2 pulley` |
| `onset_date` | `YYYY-MM-DD` |
| `status` | `active` · `resolved` |
| `resolved_date` | `YYYY-MM-DD` (when resolved) |
| `notes` | free text |

### Template

```markdown
---
id: a2-left-ring--p8x2
site: finger_a2
label: left ring A2 pulley
onset_date: 2026-07-18
status: active
---
Felt a twinge on a deep lock. No pop.
```

---

## Backfill provenance (Kaya era)

Historical data imported from the Kaya app (July 2025 – July 2026) is marked
`source: kaya` at the session level. Rules of that era, so analyses stay honest:

- **Attempts convention** (when the true count is unknown), always flagged
  `attempts_estimated: true`:

  | result | attempts |
  |---|---|
  | send | 5 |
  | fail | 10 |
  | project send | 20 |
  | project fail | 30 |

  Known counts (e.g. a filmed flash = 1) are entered as real numbers with **no**
  estimated flag. `./log --kaya` provides this flow (`s` / `f` / `ps` / `pf`, or
  `<n>s` / `<n>f` for known counts) and chains multiple backdated sessions per run.
- **`duration_min`** on kaya sessions is user-estimated from video timestamps.
- **Symptom observations** reconstructed from memory carry `source: retrospective`.
- Dose-response / load analyses should discount or exclude `attempts_estimated`
  values and `retrospective` readings; FIG. 1 draws a divider between the
  retrospective and live eras.

## Changing the vocabulary

Adding a new value (a new `site`, `style`, discipline, etc.) is safe — edit the enum in
the matching `schema/*.schema.json` and this file together. **Renaming or removing** a
value would orphan past entries, so prefer additive changes. Same for a gym's circuit
levels: when a gym re-grades its circuits, add the new levels rather than renaming old
ones (or create a new gym entry and note the change).
