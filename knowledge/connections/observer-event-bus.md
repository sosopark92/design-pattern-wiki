---
title: "Connection: Observer and Event Bus"
connects:
  - "knowledge/concepts/observer"
  - "knowledge/reviews/opencode-bus"
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# Connection: Observer and Event Bus

## The link

Event Bus is Observer where the Subject role is extracted into a shared, centralized intermediary. The structural difference is one design decision: who holds the observer list?

| | Observer | Event Bus |
|---|---|---|
| Observer list owned by | the Subject (e.g. `UserService`) | the Bus singleton |
| Producer knows consumers? | implicitly (holds their list) | never |
| Consumer knows producer? | must reference the Subject | never |
| Multiple sources | each Subject is separate | all share one Bus |

## Key insight

In basic Observer, **coupling migrates to the Subject**. If a consumer wants events from three different Subjects, it must subscribe to each one directly. The Subject still "knows" its observers by holding their references.

Event Bus removes this by making the Subject role anonymous and shared. `publish(EventType, payload)` requires no Subject reference. Consumers `subscribe(EventType)` without knowing any producer. Both sides only know the **event type contract** — enforced in opencode via `BusEvent.define()` and Zod schemas.

The cost: because all events share the bus, **event type management becomes mandatory**. This is why the Registry pattern always accompanies Event Bus implementations.

## Push vs Pull — two Observer delivery modes

Both appear in opencode's bus:

- **Push** (`subscribeCallback`): bus drives delivery, calls callback synchronously. Simpler to write, but subscriber errors can affect the dispatch loop (opencode wraps with `Effect.tryPromise` to prevent this).
- **Pull** (`subscribe` returning `Stream`): consumer drives consumption. Natural fit for async pipelines; backpressure is handled by the stream infrastructure, not the bus.

## Two-tier dispatch — Observer optimized for type filtering

The `wildcard` + `typed` split is Observer applied at two levels:

1. **Typed channel** — a dedicated PubSub per event type, created lazily on first subscription. Only that type's subscribers receive events here.
2. **Wildcard channel** — one PubSub that receives every event. Wildcard subscribers pay no per-type overhead.

Without this split, a wildcard subscription forces every `publish()` to scan all subscribers regardless of type — O(total subscribers) per publish. With the split, type-specific dispatch is O(subscribers for that type), and wildcard dispatch is a single channel publish.

## Evidence

Seen in [[knowledge/reviews/opencode-bus]]:

- `State.wildcard` (line 27) and `State.typed` (line 28) implement the two-tier structure
- `publish()` (lines 86-107) dispatches to typed channel first, then wildcard — explicit two-tier logic
- `BusEvent.define()` is the Registry that makes the Event Bus's event contracts explicit
- `GlobalBus.emit()` (line 100) shows Event Bus composing: the local bus is itself an Observer of global events

## Related

- [[knowledge/concepts/observer]] — the underlying mechanism
- [[knowledge/reviews/opencode-bus]] — evidence source
