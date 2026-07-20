---
date: 2026-07-20
topic: blog-section
focus: blog architecture + UI — injury deep-dives and progress writing; ARCHIVE|BLOG masthead split; plaintext→formatted pipeline
---

# Ideation: Blog Section

## Codebase Context
Svelte 5 SPA, hash routing (#demo), data compiled from markdown+frontmatter files at
build time; About section already imports markdown via ?raw; KGDVS B&W design system
(hairlines, uppercase micro-labels, numbered ledgers, FIG. captions); masthead sub-line
("TRAINING ARCHIVE — …") is the natural nav split point. Injuries are entities with
ids — the obvious link target for deep-dive writing. Not yet deployed to a public URL.

## Ranked Ideas

### 1. Blog spine — posts-as-files + ARCHIVE|BLOG masthead split
**Description:** `posts/YYYY-MM-DD--slug.md` (frontmatter: title, date, injury_id?,
draft?); compiled into the build like entries; hash routes `#blog` + `#blog/slug`;
masthead becomes TRAINING ARCHIVE | BLOG.
**Rationale:** consistent with the whole files-as-truth architecture; everything else
depends on it. **Confidence:** 90% · **Complexity:** Medium · **Status:** Explored

### 2. KGDVS article typography (renderer IS the auto-formatter)
**Description:** tiny dependency-free markdown-subset renderer styled to the design
language: 640px measure, hairline section rules, FIG.-style captions, numbered post
index. Author writes plaintext; CSS makes it look good.
**Rationale:** honest version of the "auto format plaintext" ask.
**Confidence:** 85% · **Complexity:** Medium · **Status:** Explored

### 3. Data embeds — shortcodes pulling live data into prose
**Description:** `{{injury:id}}` → inline pain curve; `{{session:date}}` → session
card; `{{fig1}}` → load×pain chart, all rendered from data.json inside posts.
**Rationale:** the differentiator — injury deep-dives written AROUND the real data;
payoff of a year of structured logging. **Confidence:** 80% · **Complexity:** Medium-High · **Status:** Unexplored

### 4. Injury dossiers
**Description:** per-injury page (#injury/slug) auto-assembling curve, observation
timeline, onset-era sessions, and linked posts; FIG.1 annotations clickable into them.
**Rationale:** "go deep on each injury" exists as a page even before writing does.
**Confidence:** 75% · **Complexity:** Medium · **Status:** Unexplored

### 5. ./post CLI
**Description:** `./post "title"` scaffolds frontmatter, opens $EDITOR, deterministic
tidy (typographic quotes, paragraph normalization), validates, commits, pushes.
**Rationale:** same muscle memory as ./log; zero-friction writing.
**Confidence:** 85% · **Complexity:** Low · **Status:** Explored

## Rejection Summary
| # | Idea | Reason Rejected |
|---|---|---|
| 1 | LLM auto-restructure of braindumps | would rewrite the author's words; renderer + tidy achieve "looks good" honestly |
| 2 | RSS feed | site not yet deployed; trivial later at compile time |
| 3 | Tags/series taxonomy | premature at zero posts; injury_id is the only needed link |
| 4 | Separate drafts workflow | one draft:true field — folded into #1 |
| 5 | Media/photo pipeline | basic ![img] folds into #2; real media story later |
| 6 | Comments/webmentions | personal archive, not a platform |

## Notes
- Build order: 1+2 → 5 → 3/4. Deploying to a public URL becomes much more attractive
  once the blog exists.

## Session Log
- 2026-07-20: Initial ideation — 12 candidates, 5 survived.
- 2026-07-20: Ideas 1+2+5 (blog spine, typography, ./post CLI) selected → ce:brainstorm.
