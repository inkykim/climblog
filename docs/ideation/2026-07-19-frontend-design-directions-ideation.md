---
date: 2026-07-19
topic: frontend-design-directions
focus: minimal black & white KGDVS-inspired dashboard; 3 built variants with a year of dummy data to pick from
---

# Ideation: Frontend Design Directions

## Codebase Context
Vite + Svelte 5 SPA in `app/` reading a compiled `data.json` (load events with per-climb
arrays, symptom observations, injuries, gyms with grading systems). Current UI is a
generic-clean placeholder (indigo accents, soft cards) — nothing worth preserving
aesthetically. Component decision (this session): custom-minimal Svelte + CSS for
direction comparison; adopt shadcn-svelte primitives in Phase 3 (forms). Aesthetic
anchor: Office KGDVS — stark white, black type, hairline rules, strict grid, uppercase
micro-labels, square corners, no shadows, graphic and striking.

## Ranked Ideas (survivors — each built as a variant with 1 year of dummy data)

### 1. V1 — "The Index" (list-first archive ledger)
**Description:** The year as a dense numbered index: every session a hairline-ruled row
(001–NNN) with date, venue, climbs/sends, top grade in tabular monospace numerals.
Year day-strip at top (365 ticks), injuries as a compact side ledger with sparklines.
**Rationale:** Closest to KGDVS's actual project-index idiom; maximal scannability of a
year; density = the archive feels substantial.
**Downsides:** Least graphic of the three; charts are peripheral.
**Confidence:** 75% · **Complexity:** Medium · **Status:** Explored (built)

### 2. V2 — "The Poster" (graphic-first modular grid)
**Description:** Editorial poster: oversized numerals (sessions, sends, hardest grade)
as typography-as-graphic, modular hairline-bordered tiles, hero year heatmap (black
squares on white), bold monochrome bars for monthly volume, injury bands.
**Rationale:** The "striking" end of the brief — the data becomes wall-poster graphics;
most memorable first impression.
**Downsides:** Lowest information density; aggregates hide session detail behind scroll.
**Confidence:** 70% · **Complexity:** Medium · **Status:** Explored (built)

### 3. V3 — "The Chart Room" (visualization-first annual report)
**Description:** Tufte-flavored annual report: full-width load timeline with injury-pain
overlay, grade-progression step chart, send pyramid by grade, monthly small multiples,
style distribution — all hand-rolled hairline SVG, tables secondary.
**Rationale:** Directly serves the research/analysis ambition (trends, recovery curves,
progression); most insight per screen.
**Downsides:** Most build effort per new feature; risks "report" feeling over "journal".
**Confidence:** 70% · **Complexity:** Medium-High · **Status:** Explored (built)

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Broadsheet (newspaper columns) | Weaker duplicate of Chart Room; multi-column fights responsive |
| 2 | Blueprint (architectural drawing motif) | Decoration over data; KGDVS is restrained, not skeuomorphic |
| 3 | Calendar Monolith (year calendar as entire UI) | Hides injury/progression views; heatmap folded into V2 |
| 4 | Filmstrip (horizontal timeline) | Horizontal scroll fails year-scanning, worse on mobile |
| 5 | Terminal (monospace/ASCII) | Dev-toy aesthetic, not gallery-clean; mono numerals folded into V1 |
| 6 | Museum Label (one luxurious card per session) | Whitespace luxury = endless scroll at a year of data |
| 7 | Dense Dashboard (Bloomberg-in-B&W) | Density without striking-ness; small multiples folded into V3 |
| 8 | Magazine Cover (hero stat + tabs) | Hides data behind tabs; style over function |
| 9 | Split Ledger (fixed rail + list) | Layout plumbing, not a direction; absorbed into V1 |

## Key implementation notes
- Variants live behind hash routes `#v1 #v2 #v3` in the existing app; no hash = real
  dashboard untouched. All three read `data-demo.json` (generated, ~1yr, deterministic
  seed) — real dataset stays clean.
- Charts hand-rolled SVG (hairline control Chart.js can't match); Chart.js remains on
  the real dashboard until a winner is chosen.
- Component layer: custom-minimal now; shadcn-svelte primitives at Phase 3 (user
  decision 2026-07-19).

## Session Log
- 2026-07-19: Initial ideation — 12 candidates generated, 3 survived; all 3 built as
  variants with 1yr dummy data for user selection.
