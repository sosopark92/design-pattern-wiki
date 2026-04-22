# Knowledge Index

_Last updated: 2026-04-21_

## Concepts

| Article                               | Summary                                                             | Updated    |
| ------------------------------------- | ------------------------------------------------------------------- | ---------- |
| [[knowledge/concepts/composite]]      | Tree structures where leaf and branch objects share a common interface | 2026-04-14 |
| [[knowledge/concepts/observer]]       | One-to-many dependency; Push/Pull delivery modes; Event Bus variant | 2026-04-21 |
| [[knowledge/concepts/observer-ko]]    | 옵저버 패턴: 1:N 의존성, Push/Pull 전달 방식, Event Bus 변형       | 2026-04-21 |

## Reviews

| Article                                | Source             | Language   | Snippets                                   | Patterns found                                   |
| -------------------------------------- | ------------------ | ---------- | ------------------------------------------ | ------------------------------------------------ |
| [[knowledge/reviews/opencode-bus]]     | anomalyco/opencode | TypeScript | bus-events.ts, global.ts, src-bus-index.ts | Observer, Event Bus, Registry, Two-tier Dispatch |
| [[knowledge/reviews/opencode-bus-ko]]  | anomalyco/opencode | TypeScript | bus-events.ts, global.ts, src-bus-index.ts | Observer, Event Bus, Registry, 2-tier Dispatch (한국어) |

## Connections

| Article                                          | Connects             | Summary                                                                                              |
| ------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------- |
| [[knowledge/connections/observer-event-bus]]     | Observer ↔ Event Bus | Event Bus is Observer with shared Subject; three-layer architecture; Push/Pull; two-tier dispatch    |
| [[knowledge/connections/observer-event-bus-ko]]  | Observer ↔ Event Bus | Subject를 공유 중개자로 추출한 옵저버; 3-레이어 아키텍처; Push/Pull; 2-tier 디스패치 (한국어)       |

## Antipatterns

| Article | Summary |
| ------- | ------- |

## Practices

| Article | Pattern | Status | Date |
| ------- | ------- | ------ | ---- |
