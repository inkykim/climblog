# climblog

A personal climbing & injury training journal. Data lives as YAML-frontmatter markdown
files in this repo (the source of truth); every entry is validated against a JSON Schema
in CI so the dataset stays clean and research-ready.

A web app for logging and visualizing this data is planned
(see [`docs/plans/`](docs/plans/)), but the data format works on its own **today** — you
can log by committing files.

## Log an entry (by hand, right now)

1. Open [`codebook.md`](codebook.md) and copy the template for what you're logging:
   - a **load event** (climbing session, rest-day workout, or rest/nothing day) →
     `entries/load-events/`
   - a **symptom observation** (how an injury feels) → `entries/symptom-observations/`
   - a new **injury** to track → `injuries/`
2. Save it as `<date>--<shortid>.md` (the `id:` inside must match the filename).
3. Commit and push. CI validates it automatically.

The goal is to log *something* every day — even a one-line `type: rest` entry.

## Validate locally (optional)

```bash
pip install -r scripts/requirements.txt
python scripts/validate.py
```

Prints `All climblog entries valid.` or per-file errors.

## Layout

```
entries/load-events/            one file per training day
entries/symptom-observations/   one file per injury reading
injuries/                       one file per tracked injury
schema/                         canonical JSON Schemas (CI enforces these)
codebook.md                     human-readable field reference + templates
scripts/validate.py             CI + local validator
docs/                           brainstorm, plan
```
