---
date: 2026-07-19
topic: climblog-pipeline
---

# Climblog: Data Format + Logging Pipeline

## Problem Frame
A solo climber (~1 year in, now training seriously) wants to log daily training,
rest-day workouts, and injury feel/recovery in a way that is (a) low-friction
enough to do *every day*, and (b) clean and structured enough to become real
longitudinal research data later. GitHub is the chosen home because pushing new
info daily is easy and the history is durable. The open question this brainstorm
resolves: **what format do entries take, and what is the actual pipeline for
entering and viewing them?**

The core tension throughout: **daily friction vs. research-grade structure.** Every
decision below is chosen to satisfy both — machine-readable fields for data quality,
plus a fast entry UX and freeform notes for human sustainability.

## Selected Foundation (from ideation)
Ideas #1–#4 from `docs/ideation` are the accepted spine:
- **#1** YAML-frontmatter entries + a controlled-vocabulary codebook
- **#2** Two universal record types: *load events* + *symptom observations*
- **#3** Lagged injury follow-ups (day-of / day-after recovery curve)
- **#4** Schema validation in CI

## Requirements

### Data format
- **R1.** The source of truth is files committed to the GitHub repo. Each entry has
  YAML frontmatter (structured, machine-readable fields) plus an optional freeform
  markdown notes section.
- **R2.** A committed `codebook` defines the allowed values for coded fields (grade
  scale, session/workout types, injury sites, pain scale, load-tolerance stoplight).
  Entries conform to it.
- **R3.** Two record types share a common `date` key so they join for analysis:
  - *Load event* — anything that stresses tissue: a climbing session, a rest-day
    workout (lifting, mobility, antagonist work), etc. Captures duration, type,
    volume, intensity/RPE, and (for climbing) grades/styles.
  - *Symptom observation* — a dated reading on one injury: pain 0–10, load tolerance
    (green/yellow/red), range-of-motion/other notes.
- **R4.** Each entry carries an **explicit, editable date** defaulting to today but
  freely backdatable — because entries are often logged the next day ("forgot
  yesterday").

### Daily habit
- **R5.** The intent is to log *something every day*, including non-climbing days
  (a rest-day workout, or a minimal wellness/"nothing" entry). Logging a rest or
  nothing day must be near-instant (a tap or two).
- **R6.** The web app surfaces when **today has not been logged yet**, to build the
  daily-logging routine.

### Injury tracking
- **R7.** Each injury is a tracked entity with an identity, so its symptom
  observations over time form a recovery curve.
- **R8.** While an injury is **active**, the web app prompts (app-driven) to log
  today's status when opened — active injuries appear at the top with a quick
  "log today's status" action. (A scheduled push nudge is explicitly deferred; see
  Scope Boundaries.)

### Validation (research quality)
- **R9.** A GitHub Action validates every commit's entries against a schema derived
  from the codebook. Invalid entries (bad coded value, missing required field) fail
  CI so the dataset stays consistently structured over time.
- **R10.** Data must be exportable/derivable into a flat, analysis-ready form (e.g.
  tidy tables of load events and symptom observations) for future research use.

### Pipeline / app
- **R11.** The web app both **reads** the repo (to visualize data) and **writes** to
  it (entry forms commit new/edited entries via the GitHub API).
- **R12.** Auth is **"Log in with GitHub" via serverless OAuth**. There is no custom
  user database or password system; only the repo owner can write. Write-protection
  is inherited from GitHub repo permissions.
- **R13.** Hosting is a static site plus one small serverless function (only to hold
  the OAuth client secret / complete the OAuth exchange).
- **R14.** Entry forms are **desktop-focused but genuinely usable on mobile**
  (responsive; fast, thumb-friendly forms for next-day mobile logging).
- **R15.** The read/visualization side shows at minimum: entry history/timeline and
  a per-injury recovery trend. (Richer dashboards/rollups are deferred.)

## Success Criteria
- Logging any entry type (climb / rest workout / injury check / nothing day) takes
  well under a minute, on desktop or mobile.
- Every committed entry is schema-valid; a year of entries is a clean, consistent,
  machine-readable dataset exportable for analysis without a cleanup project.
- An active injury's recovery curve (day-of → subsequent days) is visible in the app.
- Daily logging becomes routine — the app makes an unlogged day obvious and a
  "nothing" day trivial to record.
- Only the owner can write; no auth system had to be hand-built.

## Scope Boundaries (non-goals)
- **No custom user/password auth.** GitHub is the identity and write gate.
- **No multi-user / sharing / social features.** Single user.
- **No scheduled push reminders yet.** App-driven prompts only (R8). A nudge
  (Action-generated GitHub notification/email while an injury is active, or a daily
  "you haven't logged" ping) is a future add if forgetting proves to be a problem.
- **No wearable / third-party app import** (Strava, Apple Health, climbing apps).
  Manual entry only for now.
- **No advanced analytics** (training-load / ACWR injury-risk metric, grade
  pyramids, rich dashboards) in this scope — future, enabled by the clean schema.
- **No per-route/project attempt tracking** as a first-class feature yet — treat as
  a possible future field within the schema.

## Key Decisions
- **Files-in-repo are the source of truth, not a database.** Preserves the "push to
  GitHub daily" premise, keeps history durable, and makes the data research-portable.
- **Reuse GitHub auth instead of building one.** For a single user, repo push access
  *is* the write gate; chosen mechanism is serverless OAuth for a clean login UX,
  accepting one function to maintain (vs. the no-backend paste-a-token alternative).
- **Two record types, not "sessions".** Decouples injury logging from whether you
  climbed, makes rest-day workouts first-class, and yields two tidy tables for research.
- **Explicit editable date + daily-something habit.** Backdating and a low-effort
  "nothing" entry are load-bearing for real daily adherence.

## Dependencies / Assumptions
- Assumes a single GitHub account/user and one repo.
- Assumes the owner can register a GitHub OAuth app and deploy one serverless function.
- Assumes GitHub API rate limits are a non-issue at single-user daily-commit volume.

## Outstanding Questions

### Resolve Before Planning
- (none — product behavior, scope, and success criteria are defined)

### Deferred to Planning
- [Affects R1/R9][Technical] Data file layout: one file per entry vs. one file per
  month/append — trade-off between merge simplicity and file count.
- [Affects R2][Technical] Exact starting codebook / field set for load events and
  symptom observations (draft exists in requirements; refine during planning).
- [Affects R9][Technical] Schema representation (JSON Schema vs. other) and how CI
  parses YAML frontmatter to validate.
- [Affects R7/R8][Technical] How "active injury" state is stored/derived (explicit
  status field vs. inferred from recent observations).
- [Affects R11/R13][Technical] Web stack, static host, and serverless platform choice;
  GitHub API commit approach (single-file contents API vs. tree/commit API).
- [Affects R12][Technical] OAuth app registration, token scopes (fine-grained, repo-
  limited), and token handling in the browser.
- [Affects R10][Needs research] Export shape / tooling for the analysis-ready tables.

## Next Steps
→ `/ce:plan` for structured implementation planning
