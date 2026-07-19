# Climblog codebook

The **schemas in `schema/` are canonical** — CI validates every entry against them.
This file is the human-readable mirror: the allowed values, plus copy-paste templates
so you can log by hand without opening the JSON.

Every record is one markdown file with YAML frontmatter. The frontmatter is the data;
anything below the closing `---` is freeform notes (ignored by validation).

## Filenames & ids

- Load events → `entries/load-events/<date>--<shortid>.md`
- Symptom observations → `entries/symptom-observations/<date>--<shortid>.md`
- Injuries → `injuries/<slug>--<shortid>.md`

`<shortid>` is any 2–8 lowercase-alphanumeric tag you pick (e.g. `k3f9`) to keep multiple
entries on the same day distinct. **The `id:` in the frontmatter must equal the filename
without `.md`.** Dates are `YYYY-MM-DD` and do **not** need quotes.

---

## Record type: load event

One per training day — a climbing session, a rest-day workout, or a minimal rest/nothing
day. Log *something* every day.

**Fields** (only `id`, `type`, `date` are required):

| field | values |
|---|---|
| `type` | `climbing_session` · `rest_workout` · `rest` · `nothing` |
| `date` | `YYYY-MM-DD` |
| `duration_min` | integer minutes |
| `disciplines` | list of `boulder` · `lead` · `top_rope` · `board` · `autobelay` |
| `location` | free text |
| `volume` | integer — total problems/routes attempted |
| `hardest_send` | grade string, e.g. `V5`, `5.11c` |
| `grades` | list of `{ grade, discipline, result, count }` — `result` ∈ `send` `flash` `onsight` `attempt` `project` |
| `workout_type` | list of `lifting` · `mobility` · `antagonist` · `cardio` · `hangboard` · `stretching` · `other` |
| `rpe` | integer 1–10 (session effort) |
| `notes` | free text |

### Template — climbing session

`entries/load-events/2026-07-19--k3f9.md`

```markdown
---
id: 2026-07-19--k3f9
type: climbing_session
date: 2026-07-19
duration_min: 90
disciplines: [boulder]
location: local gym
volume: 18
hardest_send: V5
rpe: 7
grades:
  - grade: V4
    discipline: boulder
    result: send
    count: 3
  - grade: V5
    discipline: boulder
    result: project
    count: 5
---
Felt strong on crimps, weak on slopers. Tweaked nothing.
```

### Template — rest-day workout

```markdown
---
id: 2026-07-20--a1b2
type: rest_workout
date: 2026-07-20
duration_min: 45
workout_type: [antagonist, mobility]
rpe: 5
---
Push day + shoulder prehab.
```

### Template — nothing / full rest day

```markdown
---
id: 2026-07-21--z0z0
type: rest
date: 2026-07-21
---
```

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
| `notes` | free text |

### Template

`entries/symptom-observations/2026-07-19--m2a1.md`

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

`injuries/a2-left-ring--p8x2.md`

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

## Changing the vocabulary

Adding a new value (a new `site`, `workout_type`, etc.) is safe — edit the enum in the
matching `schema/*.schema.json` and this file together. **Renaming or removing** a value
would orphan past entries, so prefer additive changes.
