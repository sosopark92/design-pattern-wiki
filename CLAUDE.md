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
pseudo/       = practice problems  (user writes pseudo code, LLM reviews)
LLM           = compiler           (generates problems, reviews, organizes knowledge)
knowledge/    = knowledge base     (structured, queryable, LLM-owned)
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
├── pseudo/                          ← practice problems (one file per pattern per session)
│   └── YYYY-MM-DD-<pattern-name>.md
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
  - "pseudo/YYYY-MM-DD-<pattern>.md"
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

- [[pseudo/YYYY-MM-DD-<pattern>]] — practice session where this was applied
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
  - "pseudo/YYYY-MM-DD-<pattern>.md"
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
  - "pseudo/YYYY-MM-DD-<pattern>.md"
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

## Pseudo Code Practice Format

`pseudo/YYYY-MM-DD-<pattern-name>.md`

```markdown
---
date: YYYYMMDD
pattern: <pattern-name>
status: problem | in-progress | reviewed
---

# 문제

**시나리오:**
[실전 사례 서술 — 2~4문장. 어떤 시스템인지, 왜 복잡한지]

**기본 시나리오:**
[step-by-step 흐름. 각 단계에서 시스템이 무엇을 알아야 하는지 명시]
[한 곳에 다 우겨넣으면 어떤 문제가 생기는지 끝에 언급]

**요구사항:**

1. **핵심 동작:** 구현해야 할 메서드 목록
2. **정책은 외부에서 주입 가능:** 바뀔 수 있는 정책/전략/의존성 목록
3. **테스트 관점:** 실제 인프라 없이 테스트 가능해야 하는 시나리오 2~3개

**예시 사용:**
// 운영 환경
Service = ConcreteService(dep1: Real...(), dep2: Real...(), ...)

// 테스트 환경
testService = ConcreteService(dep1: Fake...(), dep2: Fake...(), ...)

**안티패턴:**
class BadService:
def method(): # 의존성을 내부에서 직접 생성
db = ConcreteDatabase(...)
api = ConcreteAPI(...) # 정책 하드코딩
...

- 이걸 [Pattern Name]으로 어떻게 고쳐야 할까?

---

# Pseudo Code

[사용자 작성]

---

# Review

[Claude 작성]

## 구조 정확성

패턴의 핵심 구조(인터페이스, 역할 분리 등)가 올바르게 표현되었는가.

## 패턴 의도 충족

이 패턴이 해결하려는 문제(결합도, 확장성, 테스트 가능성 등)가 실제로 해소되었는가.

## 개선점

구체적인 수정 제안. 있을 경우만 작성.

## knowledge/ 연결

- [[knowledge/concepts/<pattern>]] — 이 풀이에서 확인된 핵심 개념
```

---

## Operations

### Practice (pseudo/ 생성)

When I say "[패턴명] 문제 내줘" or "[패턴명] 연습하고 싶어":

1. Read `knowledge/concepts/<pattern>.md` to understand what's been learned
2. Check existing `pseudo/` files for that pattern — avoid repeating scenarios already practiced
3. Generate a new real-world scenario problem following the Pseudo Code Practice Format above
4. Create `pseudo/YYYY-MM-DD-<pattern>.md` with the 문제 section filled in, Pseudo Code and Review sections left blank
5. Append to `knowledge/log.md`

### Review (pseudo/ → knowledge/)

When user has filled in the Pseudo Code section and says "리뷰해줘" or "review":

1. Read the pseudo file
2. Fill in the Review section (구조 정확성, 패턴 의도 충족, 개선점, knowledge/ 연결)
3. Update `status` frontmatter to `reviewed`
4. If the practice revealed a non-obvious insight → update the relevant `knowledge/concepts/` article
5. If a new antipattern was identified → create `knowledge/antipatterns/<name>.md`
6. Update `knowledge/index.md` Practices table
7. Append to `knowledge/log.md`

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

## Practices

| Article | Pattern | Status | Date |
| ------- | ------- | ------ | ---- |
```

---

## `knowledge/log.md` Format

```markdown
## [YYYY-MM-DDTHH:MM] practice | pseudo/YYYY-MM-DD-<pattern>.md

- Problem created: [[pseudo/YYYY-MM-DD-<pattern>]]
- Pattern: <pattern>

## [YYYY-MM-DDTHH:MM] review | pseudo/YYYY-MM-DD-<pattern>.md

- Review completed: [[pseudo/YYYY-MM-DD-<pattern>]]
- Concepts updated: [[knowledge/concepts/<pattern>]]
- Antipatterns created: (if any)

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
- Never delete `knowledge/` pages — mark superseded with `> **Superseded:** ...`
- Never delete `pseudo/` files — they are a practice record
- Never leave a broken wikilink — create the target page in the same session
- Always update `index.md` and `log.md` on every operation
