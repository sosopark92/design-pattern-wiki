# Knowledge Build Log

## [2026-04-22T01:00] update | knowledge/concepts/event-bus.md + event-bus-ko.md

- Source: https://www.geeksforgeeks.org/system-design/event-driven-architecture-system-design/
- Added: EDA context (Event Bus as architectural pattern, not just design pattern)
- Added: 5-component EDA model (Event Source, Event, Event Broker, Publisher, Subscriber)
- Added: Supporting roles (Event Handler, Dispatcher, Listener)
- Added: Real-world application domains (financial, e-commerce, telecom, gaming, flight booking)
- Added: EDA-specific cons (async debugging difficulty, event ordering, latency, eventual consistency)
- Added: "When NOT to use" — strong consistency requirement
- Updated: index.md entries for both files

## [2026-04-22T00:00] practice | pseudo/2026-04-22-event-bus.md

- Problem created: [[pseudo/2026-04-22-event-bus]]
- Pattern: event-bus
- Scenario: 항공 예매 시스템 — 좌석 예약 확정 시 결제·마일리지·수하물·탑승권 연동

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
