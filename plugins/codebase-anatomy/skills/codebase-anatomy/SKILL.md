---
name: codebase-anatomy
description: Analyze a codebase from its actual source and publish an interactive HTML "anatomy" guide — file structure, layer architecture, end-to-end request traces, security explained from zero, data model, project history from git, and an honest list of real defects with evidence. Built for someone who owns a project but does not fully understand it, especially AI-assisted builds. Use when asked to explain, document, or teach a codebase; to produce an architecture guide, onboarding doc, study document, 설명서, 구조 문서, or 해부도; or when someone says they do not understand code they shipped.
---

# Codebase Anatomy

Produce one self-contained interactive HTML document that lets the **owner of a codebase
explain their own system** — and see, honestly, where it is broken.

The reader is assumed to sit **between non-developer and developer**: they can read code
but do not reliably know architecture vocabulary, security concepts, or framework magic.

## The seven rules (non-negotiable)

These are what separate this document from a generic README. Violating any one of them
makes the output worse than nothing, because the reader will *trust* it.

1. **No claim without evidence.** Every structural statement carries a `file:line`.
   Before writing that line number, you must have opened that file. No exceptions.
2. **No imagined diagrams.** Dependency graphs, layer maps and call chains are *extracted*
   with commands (see `references/investigation.md`), never inferred from folder names.
3. **Report defects honestly.** Real problems go in with severity, evidence, why it matters
   and how to fix. Never soften findings to flatter the reader. A skipped defect is a lie.
4. **Be equally rigorous about what is good.** Same evidence standard. A document that only
   lists faults is demoralizing and gets closed; balance is what keeps it read.
5. **Foundational chapters assume zero knowledge.** When a concept blocks understanding
   (auth, transactions, async, build pipeline), build it from nothing before using it.
   The test: could someone who has never heard the word follow along?
6. **Make it retrieval, not reading.** Reading feels like understanding and is not.
   Every document ships a quiz and a hands-on exercise. See `references/interactions.md`.
7. **Write in the user's language.** Match the language of the request, including all
   generated data strings inside the HTML.

## Workflow

Work through the phases in order. Do not start writing prose until Phase 3 is done —
writing early is how invented facts get in.

### Phase 1 — Recon (cheap, wide)

Identify what this project actually is before assuming anything. Never trust a folder name
(a directory under `Assets/` may not be a Unity project; `frontend/` may be empty).

```
ls -1                                  # top level
find . -type d -not -path "*/.git/*" -not -path "*/node_modules/*" | head -60
find . -name "*.EXT" -not -path "./.git/*" | wc -l    # per candidate language
```

Detect the stack from manifests: `package.json`, `build.gradle`, `pom.xml`,
`requirements.txt`, `go.mod`, `Cargo.toml`, `*.csproj`, `Gemfile`.
Count executables/processes — many projects are 2–4 programs, not one, and the reader
usually does not know this. That fact alone is often chapter 1.

### Phase 2 — Fact extraction

Produce the numbers that fill the stat strip and tables. Recipes per stack are in
`references/investigation.md`. At minimum extract:

- file counts per layer/directory, LOC per area, largest files
- API surface (endpoint inventory), data model inventory (tables/entities/collections)
- the real dependency graph between modules/services
- git history: commit count, month histogram, first/last, message-quality shift,
  and any security-related commits (secret purges are common and revealing)
- secret hygiene: what is tracked vs ignored
- config-key mismatches, `TODO|FIXME|HACK`, empty directories

Every number you print must come from a command you ran, and you should say which.

### Phase 3 — Deep read

Actually open and read, at minimum:

- the entry point(s)
- the security/auth configuration in full
- the single most important domain flow, end to end
- the largest and most complex module
- the data model root and any base/shared entity
- error handling
- one representative UI screen or client

**Rule: never write about a file you have not opened.** If time is short, cut scope, not reading.

### Phase 4 — Findings

Collect defects as you read; do not go hunting separately. For each: stable id (`F-01`),
severity, one-line title, evidence (`file:line` + the actual snippet), what is wrong,
why it matters *in consequences*, and how to fix it concretely.

Severity: **high** = exploitable or data-losing now; **mid** = will bite on change, growth,
or a second developer; **low** = confusing, cosmetic, or dead weight.

Sort by severity. Also collect the "done well" list with the same evidence standard.
Design tensions (a rule that contradicts the product's promise) belong here too — they are
often the most valuable finding and never appear in linters.

### Phase 5 — Write

Chapter structure and required content per chapter: `references/chapters.md`.
Which interactive component to reach for and why: `references/interactions.md`.
Copy `assets/kit.html` and fill its data arrays — it carries the design system and twelve
tested components. How to use it: `references/kit-usage.md`. Do not rewrite the CSS/JS;
it is already verified for light/dark/system themes, mobile, and partial-failure safety.

**Content and screen are separate.** The kit holds the content (chapters + data arrays).
The screen shell (`assets/shell.css` + `assets/shell.js`, "as-shell") turns it into an app
with five views — **map** (understanding ring, severity counts with the top findings, a
commit sparkline from `TIMELINE`, chapter cards), **chapter reader** (one chapter at a time,
a side list of the chapter's parts and the findings it cites, prev/next, read marks; the
request tracer gains a clickable lane diagram with a moving packet), **defect board**
(columns by severity, mark each finding 이해함 / 고침, a tab for what is done well),
**quiz** (one question at a time, answers remembered), **glossary** (search, hide definitions). Never write or edit the shell
by hand; inject it after the content is done:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/upgrade.js anatomy.html --key <project-slug>-anatomy
```

The shell only *reads* the content: `section[data-nav]` inside `main.main`, `.eyebrow`,
`h2`, and the kit's arrays (`FINDINGS`, `QUIZ`, `TRACES`, `GLOSSARY`, `STATS`). Lane names in
the tracer come from each step's `wl` prefix (text before ` · `), so keep `wl` short and
consistent per lane.

### Phase 6 — Verify (mandatory before publishing)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/check.js anatomy.html   # syntax · {{xref}} · array shapes · data-t · shell present
node ${CLAUDE_SKILL_DIR}/scripts/shot.js anatomy.html home ""                  # map view (needs Chrome/Edge)
node ${CLAUDE_SKILL_DIR}/scripts/shot.js anatomy.html trace 'AS.openSec("sTRACE")'
node ${CLAUDE_SKILL_DIR}/scripts/shot.js anatomy.html fx 'AS.show("fx")'
```
`check.js` must print 「문제 없음」 and each screenshot's error field must be `none`
(shots land in `shots/` next to the file; delete them after looking). Headless Chrome cannot
capture a scrolled view, so to see something lower down, pass JS that hides the blocks above it.
Then re-check a sample of `file:line` claims against the real files. A wrong line number
destroys the document's only real asset — its trustworthiness.

### Phase 7 — Publish

Load `artifact-design` per its own trigger rules, then publish with the `Artifact` tool.
Hand the user the URL and a summary of what the investigation actually found —
lead with the discoveries, not the feature list.

## Updating an existing anatomy

If one already exists for the project (`Artifact action:"list"`), read it and build on it —
same URL, same `--key`, same section ids. Read marks, fix marks and quiz answers live in the
reader's localStorage under that key; a new URL or key silently drops them.

**Screen-only refresh** (content unchanged):
1. `Artifact action:"read"`, then read the saved file to the last line.
2. `node ${CLAUDE_SKILL_DIR}/scripts/upgrade.js <saved file> <work file>` — strips the publish
   wrapper and injects (or swaps in the latest) shell. Running it again is safe.
3. `check.js` + `shot.js`, confirm the chapters and data block are unchanged from the original,
   then publish to the same URL. A share link pinned to an older version keeps showing that
   version until the owner moves the pin — say so.

## Scaling

Default to the full chapter set. For a small codebase (< ~2k LOC) drop the project-history,
alternatives and dependency-graph chapters; keep evidence, findings, traces and the quiz —
those carry the value at every size.

If the codebase is large, prefer **fewer chapters read properly** over broad coverage
written from guesses. Rule 1 outranks completeness.
