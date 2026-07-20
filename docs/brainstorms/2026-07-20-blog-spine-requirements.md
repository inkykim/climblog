---
date: 2026-07-20
topic: blog-spine
---

# Blog Spine: Posts, Routes, Typography, ./post CLI

## Problem Frame
The journal captures structured data but has nowhere for long-form thinking — injury
deep-dives, progress reflections, random ideas. The writing should live in the same
files-as-truth architecture, render in the same KGDVS design language, and cost as
little friction as `./log`. (Data embeds in posts and per-injury dossier pages are
explicitly later phases — see docs/ideation/2026-07-20-blog-section-ideation.md.)

## Requirements

### Content model
- R1. A post is one markdown file in `posts/`, named `YYYY-MM-DD--slug.md`, with
  frontmatter: `title` (required), `date` (required), `injury_id` (optional link to an
  injury entity), `draft` (optional bool). Body is markdown.
- R2. Posts are schema-validated in CI like every other record type (title/date
  required, injury_id must reference an existing injury, id/filename match).
- R3. `draft: true` posts are excluded from the rendered site entirely (index and
  direct URL). The file itself is public in the repo — accepted, consistent with the
  whole archive.

### Site
- R4. Masthead nav becomes **TRAINING ARCHIVE | BLOG | ABOUT** (About keeps its
  fold-out behavior). The full masthead — barcode strip + tally — appears on every
  view; it is the site's identity.
- R5. `#blog` renders the post index: a bare numbered ledger (NO. · DATE · TITLE ·
  RE: injury label when linked), newest first, same idiom as the session index. No
  excerpts.
- R6. `#blog/<slug>` renders the post: KGDVS article typography — ~640px measure,
  uppercase micro-label metadata line (date · injury link), hairline rules, generous
  leading. Clicking an index row navigates there; browser back works (hash routing).
- R7. The markdown renderer is small, dependency-free, and covers a deliberate
  subset: headings (##/###), paragraphs, bold/italic, links, blockquotes,
  ordered/unordered lists, images, inline code. Unknown syntax degrades to plain
  text — never breaks the page.
- R8. Posts render well on mobile (same 640px measure logic; images scale).

### Writing workflow
- R9. `./post "title"` scaffolds the file (slug from title, today's date, frontmatter),
  opens `$EDITOR` (nano default), and on close: deterministic tidy (typographic
  quotes/dashes, trim trailing whitespace, collapse >2 blank lines — never rewrites
  words), validates, commits, pushes. `./post` with no args lists drafts and recent
  posts and can reopen one for editing.
- R10. Editing an existing post = reopen via `./post` or any editor; the post-edit
  validation loop (as in ./log) guards broken frontmatter.

## Success Criteria
- Writing and publishing a post takes one command and one editor session.
- A plaintext-ish post renders looking deliberately designed with zero manual styling.
- Blog and archive read as one site (shared masthead, shared design language).
- CI keeps posts as clean as entries (no broken frontmatter/links reach the site).

## Scope Boundaries
- No data embeds/shortcodes in post bodies (ideation idea 3 — later phase).
- No injury dossier pages (idea 4 — later phase).
- No RSS, tags/series, comments, or media pipeline beyond basic `![img]`.
- No LLM rewriting of post text — tidy is deterministic and word-preserving.

## Key Decisions
- **Full masthead on every view** — barcode + tally are the site's logo; writing sits
  visibly on top of the archive. (User, 2026-07-20)
- **Bare ledger index, no excerpts** — titles do the selling; matches session index.
  (User, 2026-07-20)
- **Renderer is the formatter** — "auto-format plaintext" is achieved by typography,
  not by rewriting the author's words.
- **Posts validated in CI** like all other records — the blog is part of the dataset.

## Outstanding Questions

### Resolve Before Planning
- (none)

### Deferred to Planning
- [Affects R7][Technical] Exact markdown-subset grammar and its escaping/edge rules.
- [Affects R7][Technical] Where post images live (`posts/media/`?) and size guidance.
- [Affects R5][Technical] Whether posts ship inside data.json or a separate
  posts.json (payload size at build).
- [Affects R9][Technical] Slug collision handling and slug length limits.

## Next Steps
→ `/ce:plan` for structured implementation planning
