# Design Pattern Study Wiki

A personal knowledge base for studying design patterns — built with Claude Code and maintained automatically as you study.

## What this is

Instead of taking scattered notes, this wiki **compounds knowledge over time**. Every study session, every GitHub repo you analyze, every piece of code you write gets compiled into a structured, interlinked knowledge base that grows smarter the more you use it.

```
daily/        → session logs      (what happened each study session)
LLM           → compiler          (extracts and organizes knowledge)
knowledge/    → knowledge base    (structured, queryable, LLM-owned)
```

## Stack

- **Claude Code** (VS Code extension) — reads code, writes wiki files
- **Git** — version history for the entire wiki
- **Obsidian** (optional) — browse the wiki with graph view and backlinks

## Project structure

```
design-pattern-wiki/
├── CLAUDE.md                  ← instructions for Claude Code
├── .claude/
│   └── settings.json          ← hooks + permissions
├── hooks/
│   ├── session-start.py       ← shows wiki status at session start
│   └── session-end.py         ← auto git commit at session end
├── pyproject.toml
├── daily/                     ← study session logs (append-only)
├── raw/
│   ├── snippets/              ← code files to analyze
│   └── references/            ← articles, docs, references
└── knowledge/                 ← LLM-owned wiki
    ├── index.md               ← master catalog
    ├── log.md                 ← build log
    ├── concepts/              ← one page per design pattern
    ├── reviews/               ← one page per analyzed repo or snippet
    ├── connections/           ← links between 2+ patterns
    └── antipatterns/          ← bad code examples and how to fix them
```

## Setup

**Prerequisites**

```bash
# Linux / macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# install uv
pip install uv
```

## How to use

**Start a session**

Open the project in VS Code, launch Claude Code, and start with:

```
Read CLAUDE.md first, then create the concept page for Composite pattern
based on https://refactoring.guru/design-patterns/composite
```

**Analyze a GitHub repo**

```
Analyze https://github.com/... and review it against the Composite pattern.
```

**Analyze your own code**

Drop a file into `raw/snippets/`, then:

```
Ingest raw/snippets/my-code.ts
```

**After a study session**

```
Create today's daily log. We studied Composite pattern.
Key insight: React component tree is a classic Composite implementation.
```

Then compile it into the knowledge base:

```
Compile today's daily log into the knowledge base.
```

**Query the wiki**

Once knowledge accumulates, you can ask questions like:

```
What pattern is best suited for this situation?
Show me all the repos where we found Observer pattern.
What antipatterns have I seen most often?
```

**Health check**

```
Lint the wiki.
```

This finds broken links, orphan pages, and missing concept pages.

## Study patterns

Required (in order):

1. Composite
2. Observer
3. Decorator
4. Strategy

To be decided by the group: Factory Method, Adapter, Facade, Command, Singleton, State.

## Obsidian (optional)

Open `knowledge/` as an Obsidian vault to get graph view, backlinks, and `[[wikilink]]` navigation. Claude Code writes the files — Obsidian just displays them.
