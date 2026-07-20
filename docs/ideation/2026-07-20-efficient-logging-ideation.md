---
date: 2026-07-20
topic: efficient-logging
focus: usage-audited CLI/web logging efficiency — trim what 113 real sessions prove unused
---

# Ideation: Efficient Logging Interface

## Usage Audit (113 sessions, 160 climbs, 9 observations, as of 2026-07-20)
- **Never used:** rest/nothing day types (0), rest_workout+rpe (0), outdoor+location (0)
- **Nearly never:** sent:false climbs (2/160), repeat:true (5/160), gym project labels (9%)
- **Starving:** live injury check-ins (2 real; 7/9 obs retrospective) — 4-prompt flow loses to friction
- **Actually used:** wall_angle 69%, styles 64%, notes 46%, real durations 76/113
- **Live era:** 5 sessions / 14 days, zero rest-day entries → this is a session journal, not a daily diary

## Ranked Ideas

### 1. Trim the prompt tree to audited reality
**Description:** `./log` defaults straight into a climb session; kill live "unlisted climbs?" prompt; collapse repeat/label to one optional token; venue defaults to last-used.
**Rationale:** every removed prompt is backed by a ≥90% skip rate. **Confidence:** 90% · **Complexity:** Low · **Status:** Unexplored

### 2. One-line climb grammar
**Description:** one line per climb: `3q o cd 2` (grade, wall, styles, attempts; suffix f=fail, r=repeat); session ≈ 8 typed lines.
**Rationale:** user already thinks in these codes; removes dialogue, keeps schema. **Confidence:** 80% · **Complexity:** Medium · **Status:** Unexplored

### 3. Sessions-only philosophy — rest is implicit
**Description:** officially drop the daily-something ambition; a barcode gap = rest day; codebook documents it.
**Rationale:** matches 100% of observed behavior; no fake entries. **Confidence:** 85% · **Complexity:** Low · **Status:** Unexplored

### 4. Injury pulse — one number in-flow
**Description:** replace post-session 4-prompt check-in offer with inline `pain? [0-10, enter=skip]` per active injury; auto green/yellow/red from value; full check-in stays under `i`.
**Rationale:** research dataset starving (2 live obs) with an active TFCC. **Confidence:** 85% · **Complexity:** Low-Medium · **Status:** Unexplored

### 5. Mobile quick-logger PWA (Phase 3, scoped)
**Description:** thumb-first web form — venue buttons, per-venue grade pad, wall/style chips, GitHub API commit.
**Rationale:** only idea changing WHERE logging happens (train home); build after 1+2 prove the minimal field set. **Confidence:** 70% · **Complexity:** High · **Status:** Unexplored

## Rejection Summary
| # | Idea | Reason |
|---|---|---|
| 1 | Voice dictation → parser | novelty > utility; parsing risk |
| 2 | Telegram/messaging bot | standing infra for one user |
| 3 | iOS Shortcuts → GitHub API | fragile plumbing; PWA supersedes |
| 4 | Full OAuth web forms now | #5 is the right scope first |
| 5 | Remove wall/styles prompts | counter-evidence: 65–70% usage |
| 6 | Live session chaining | folded into #1 |
| 7 | Repeat-last-session template | folded into #1 (last-venue default) |

## Session Log
- 2026-07-20: usage audit + ideation — 12 candidates, 5 survived.
