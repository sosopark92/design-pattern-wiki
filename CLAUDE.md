# CLAUDE.md — Design Pattern Study Wiki

Read this file at the start of every session before touching any files.

---

## Purpose

A personal knowledge base for a design pattern study group.
Sources come from two places: GitHub open source repositories and code I wrote myself.
Goal: build intuition for reading and diagnosing code structure across any language or framework.

---

## The Compiler Analogy

```
daily/        = session logs     (what happened in each study session)
LLM           = compiler         (extracts and organizes knowledge)
knowledge/    = knowledge base   (structured, queryable, LLM-owned)
```

---

## Directory Layout

```
design-pattern-wiki/
├── CLAUDE.md                        ← this file
├── .claude/
│   └── settings.json
├── hooks/
│   ├── session-start.py
│   └── session-end.py
├── pyproject.toml
├── daily/                           ← session logs (append-only, never edit after the fact)
│   └── YYYY-MM-DD.md
├── raw/
│   ├── snippets/                    ← code files to analyze (immutable)
│   └── references/                 ← articles, refactoring.guru pages (immutable)
└── knowledge/                       ← LLM-owned
    ├── index.md                     ← master catalog, read this FIRST on every query
    ├── log.md                       ← append-only build log
    ├── concepts/                    ← one file per pattern or concept
    ├── connections/                 ← non-obvious links between 2+ patterns
    ├── reviews/                     ← one file per analyzed code snippet or repo
    └── antipatterns/                ← bad code examples and how to fix them
```

---

## Article Formats

### `knowledge/concepts/<pattern-name>.md`

```markdown
---
title: "Pattern Name"
aliases: []
tags: [creational|structural|behavioral]
sources:
  - "daily/YYYY-MM-DD.md"
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Pattern Name

[2-3 sentence core explanation]

## Intent

What problem does this pattern solve?

## Structure

Key participants and their relationships.

## When to use

- condition 1
- condition 2

## When NOT to use

- common misuse 1

## Real examples seen

- [[knowledge/reviews/repo-name]] — how it appeared

## Connections

- Related to: [[knowledge/concepts/other-pattern]]
- Often combined with: [[knowledge/concepts/other-pattern]]

## Sources

- [[daily/YYYY-MM-DD.md]] — what was learned that day
```

---

### `knowledge/reviews/<repo-or-file-name>.md`

```markdown
---
title: "Review: name"
source_type: github | own-code
language: TypeScript | Python | Java | etc.
reviewed: YYYY-MM-DD
source: raw/snippets/filename OR https://github.com/...
---

# Review: name

## What this code does

2-3 sentences.

## Patterns identified

- **[[knowledge/concepts/composite]]** — where and how it appears

## Antipatterns / smells

- **[[knowledge/antipatterns/name]]** — description

## Strengths

- what is done well

## Suggestions

Concrete improvements, referencing patterns where relevant.

## Diagnosis

One paragraph verdict: is this good code? Why?
```

---

### `knowledge/connections/<name>.md`

```markdown
---
title: "Connection: Pattern A and Pattern B"
connects:
  - "knowledge/concepts/pattern-a"
  - "knowledge/concepts/pattern-b"
sources:
  - "daily/YYYY-MM-DD.md"
created: YYYY-MM-DD
---

# Connection: Pattern A and Pattern B

## The link

What connects these two patterns.

## Key insight

The non-obvious relationship.

## Evidence

Specific examples from reviews or sessions.
```

---

### `knowledge/antipatterns/<name>.md`

```markdown
---
title: "Antipattern: Name"
related_pattern: "knowledge/concepts/better-alternative"
sources:
  - "daily/YYYY-MM-DD.md"
created: YYYY-MM-DD
---

# Antipattern: Name

## What it looks like

Code shape that signals this antipattern.

## Why it hurts

Concrete consequences.

## How to fix it

Which pattern to apply and how.

## Examples seen

- [[knowledge/reviews/name]]
```

---

## Daily Log Format

`daily/YYYY-MM-DD.md` — append-only. Never edit a past entry.

```markdown
# Daily Log: YYYY-MM-DD

## Session (HH:MM) - Topic

**Source analyzed:** https://github.com/... or raw/snippets/filename

**Key observations:**

- found X pattern at line Y because...
- this is good/bad because...

**Patterns identified:**

- Composite — used here as...

**Lessons learned:**

- the gotcha with X is...
- good signal for Y pattern is...

**Questions to follow up:**

- [ ] why does Z use this approach?
```

---

## Operations

### Compile (daily/ → knowledge/)

When I say "compile today's log" or after a study session:

1. Read the daily log
2. Read `knowledge/index.md` to understand current state
3. For each piece of knowledge in the log:
   - If an existing concept covers it → **update** that article, add the daily log as a source
   - If it is new → **create** a new article in the right directory
   - If a non-obvious connection between 2+ patterns is revealed → **create** a connections/ article
4. Update `knowledge/index.md`
5. Append to `knowledge/log.md`

One daily log typically touches 3–8 knowledge articles.

---

### Analyze a code snippet or repo

When I say "analyze this" or "ingest raw/snippets/X":

1. Read the code carefully
2. Ask me clarifying questions if context is missing
3. Create `knowledge/reviews/<name>.md`
4. Update relevant concept pages with a link back to the review
5. Create antipattern pages if violations are found
6. Update `knowledge/index.md` and append to `knowledge/log.md`

---

### Query

When I ask a question about patterns or code:

1. Read `knowledge/index.md` first
2. Read the relevant articles
3. Synthesize an answer with wikilinks as citations
4. Offer to file the answer back as a `knowledge/qa/` article if it is substantive

---

### Lint

When I say "lint" or "health check":

Look for:

- broken `[[wikilinks]]` pointing to non-existent articles
- orphan pages with zero inbound links
- concept pages mentioned in reviews but not yet created
- antipatterns found in reviews that lack their own page
- patterns that appear in multiple reviews but have no connections/ article yet

Report as a short list with severity: error / warning / suggestion.

---

## `knowledge/index.md` Format

```markdown
# Knowledge Index

_Last updated: YYYY-MM-DD_

## Concepts

| Article                          | Summary                                               | Updated    |
| -------------------------------- | ----------------------------------------------------- | ---------- |
| [[knowledge/concepts/composite]] | Tree structures where leaf and branch share interface | YYYY-MM-DD |

## Reviews

| Article | Source | Language | Patterns found |
| ------- | ------ | -------- | -------------- |

## Connections

| Article | Connects | Summary |
| ------- | -------- | ------- |

## Antipatterns

| Article | Summary |
| ------- | ------- |
```

---

## `knowledge/log.md` Format

```markdown
## [YYYY-MM-DDTHH:MM] compile | daily/YYYY-MM-DD.md

- Articles created: [[knowledge/concepts/composite]]
- Articles updated: [[knowledge/concepts/observer]]

## [YYYY-MM-DDTHH:MM] review | repo-name

- Review created: [[knowledge/reviews/repo-name]]
- Patterns found: composite, observer

## [YYYY-MM-DDTHH:MM] lint | health check

- Errors: 0 | Warnings: 2 | Suggestions: 3
```

---

## Conventions

- **Wikilinks:** `[[knowledge/concepts/composite]]` — full path, no `.md`
- **File naming:** lowercase, hyphens — `factory-method.md`, `react-fiber.md`
- **Frontmatter:** every article must have YAML frontmatter with at minimum `title`, `sources`, `created`, `updated`
- **Writing style:** encyclopedia-style, factual, specific — "violates SRP because the class handles both persistence and rendering" not "this is messy"
- **Uncertainty:** use `> **Uncertain:** ...` blockquote when something is ambiguous
- **Updates:** when new evidence changes a claim, add `> **Updated YYYY-MM-DD:** previously X, revised after Y`

---

## Study Patterns

1. Observer

---

## Rules

- Never modify anything in `raw/` — immutable source of truth
- Never delete knowledge/ pages — mark superseded with `> **Superseded:** ...`
- Never leave a broken wikilink — create the target page in the same session
- Always update `index.md` and `log.md` on every operation
