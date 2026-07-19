# climblog

A personal climbing & injury training journal. Data lives as YAML-frontmatter markdown
files in this repo (the source of truth); every entry is validated against a JSON Schema
in CI so the dataset stays clean and research-ready.

A web app for logging and visualizing this data is planned
(see [`docs/plans/`](docs/plans/)), but the data format works on its own **today** — you
can log by committing files.

## Log an entry (the quick way)

```bash
./log
```

Answers a few prompts (~15 seconds), writes a valid entry file, commits, and
pushes — all in one go. Handles climbing sessions, rest-day workouts, rest/nothing
days, injury check-ins, and creating new injuries. After a session it offers a
check-in for each active injury. Supports backdating (`y` = yesterday, or any
`YYYY-MM-DD`). Use `./log --no-git` to write the file without committing.

The goal is to log *something* every day — even a `rest` entry is two keystrokes.

## Log an entry (by hand)

1. Open [`codebook.md`](codebook.md) and copy the template for what you're logging:
   - a **load event** (climbing session, rest-day workout, or rest/nothing day) →
     `entries/load-events/`
   - a **symptom observation** (how an injury feels) → `entries/symptom-observations/`
   - a new **injury** to track → `injuries/`
2. Save it as `<date>--<shortid>.md` (the `id:` inside must match the filename).
3. Commit and push. CI validates it automatically.

## Validate locally (optional)

```bash
pip install -r scripts/requirements.txt
python scripts/validate.py
```

Prints `All climblog entries valid.` or per-file errors.

## Web dashboard (read-only)

A static Svelte app in `app/` renders the journal: a barcode day-strip and
season tally, FIG. 1 (weekly training load x injury pain), and the full session
index (click a row for notes and every climb). `#demo` shows a generated
year of demo data; the About section content lives in `app/src/about.md`.
It reads a single `data.json` compiled from `entries/` + `injuries/` at build
time (no auth, no per-file API calls). Logging from the app (auth + forms) is
a later phase.

```bash
cd app
npm install
npm run dev       # compiles data.json, serves at http://localhost:5173
npm run build     # -> app/dist (static; deploy this)
```

Deploy target: Cloudflare Pages (or any static host). Build command
`cd app && npm install && npm run build`, output directory `app/dist`.

## License

MIT — see [LICENSE](LICENSE).

## Layout

```
entries/load-events/            one file per training day
entries/symptom-observations/   one file per injury reading
injuries/                       one file per tracked injury
schema/                         canonical JSON Schemas (CI enforces these)
codebook.md                     human-readable field reference + templates
scripts/validate.py             CI + local validator
app/                            read-only Svelte dashboard
docs/                           brainstorm, plan
```
