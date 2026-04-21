# Knowledge Build Log

## [2026-04-21T01:00] translate | Korean versions of rebuilt observer files

- Articles created: [[knowledge/concepts/observer-ko]], [[knowledge/reviews/opencode-bus-ko]], [[knowledge/connections/observer-event-bus-ko]]
- Full Korean translation of the rebuilt English articles (3-layer architecture, 2-tier dispatch, Push/Pull)

## [2026-04-21T00:00] rebuild | observer knowledge base

- Deleted: observer.md, observer-ko.md, opencode-bus.md, opencode-bus-ko.md, observer-event-bus.md, observer-event-bus-ko.md
- Rebuilt from fresh analysis of raw/snippets/opencode/ (3 files) + raw/references/designPattern-eventbus.md
- Articles created:
  - [[knowledge/concepts/observer]] — tightened; removed redundancy; added three-layer architecture reference
  - [[knowledge/reviews/opencode-bus]] — expanded to cover all 3 source files (bus-events.ts, global.ts, src-bus-index.ts); per-file pattern breakdown
  - [[knowledge/connections/observer-event-bus]] — added three-layer architecture section; updated evidence line numbers
- Key additions vs previous version:
  - bus-events.ts documented as Registry / Contract layer
  - global.ts documented as process-level propagation escape hatch (why it exists separately)
  - Full event flow diagram (define → publish → typed/wildcard/GlobalBus)

## [2026-04-14T00:00] create | composite concept

- Articles created: [[knowledge/concepts/composite]]
- Source: https://refactoring.guru/design-patterns/composite
- Status: Initial concept page from refactoring.guru reference

## [2026-04-14T01:00] analyze | opencode-bus

- Review created: [[knowledge/reviews/opencode-bus]]
- Concept created: [[knowledge/concepts/observer]]
- Source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/bus/
- Patterns identified: Observer (core), Event Bus (higher-level), Registry, Two-tier Dispatch
- Verdict: Well-designed, production-ready implementation with type safety via Zod

## [2026-04-19T15:00] translate | observer-event-bus Korean version

- Articles created: [[knowledge/connections/observer-event-bus-ko]]
- Korean translation of observer-event-bus connections article

## [2026-04-19T14:00] analyze | opencode-bus deep dive

- Session log: [[daily/2026-04-19.md]]
- Articles created: [[knowledge/connections/observer-event-bus]]
- Articles updated: [[knowledge/concepts/observer]] — added Push/Pull variants, Event Bus as Observer specialization
- Key insights: Event Bus = Observer with shared Subject; two-tier dispatch optimization; Push vs Pull delivery modes; lazy channel creation via getOrCreate
- Follow-up questions logged in daily log

## [2026-04-14T02:00] translate | Korean versions

- Articles created: [[knowledge/concepts/observer-ko]], [[knowledge/reviews/opencode-bus-ko]]
- Korean translations of Observer concept and opencode-bus review
- Maintains original structure and meaning with proper Korean terminology
