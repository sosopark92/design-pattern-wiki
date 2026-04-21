---
title: "Connection: Observer and Event Bus"
connects:
  - "knowledge/concepts/observer"
  - "knowledge/reviews/opencode-bus"
sources:
  - "knowledge/reviews/opencode-bus"
  - "raw/references/designPattern-eventbus.md"
created: 2026-04-19
updated: 2026-04-21
---

# Connection: Observer and Event Bus

## The link

Event Bus is Observer where the Subject role is extracted into a shared, centralized intermediary. The structural difference is one design decision: **who holds the observer list?**

|                           | Observer                         | Event Bus         |
| ------------------------- | -------------------------------- | ----------------- |
| Observer list owned by    | the Subject (e.g. `UserService`) | the Bus singleton |
| Producer knows consumers? | implicitly (holds their list)    | never             |
| Consumer knows producer?  | must reference the Subject       | never             |
| Multiple sources          | each Subject is separate         | all share one Bus |
| Event type management     | implicit / ad-hoc                | explicit Registry |

## Key insight

In basic Observer, **coupling migrates to the Subject**. If a consumer wants events from three different Subjects, it must subscribe to each one directly. The Subject still "knows" its observers by holding their references.

Event Bus removes this by making the Subject role anonymous and shared. `publish(EventType, payload)` requires no Subject reference. Consumers `subscribe(EventType)` without knowing any producer. Both sides only know the **event type contract** — enforced in opencode via `BusEvent.define()` and Zod schemas.

The cost: because all events share the bus, **event type management becomes mandatory**. This is why the Registry pattern always accompanies Event Bus implementations.

## Three-layer architecture (opencode)

opencode implements Event Bus as three distinct files, each with a separate responsibility:

```
bus-events.ts      → Contract layer    (이벤트 타입 정의 + Zod 스키마 등록)
src-bus-index.ts   → Dispatch layer    (인스턴스별 typed/wildcard PubSub)
global.ts          → Propagation layer (process 경계를 넘는 단순 전달)
```

**`bus-events.ts` — Registry / Contract**

`define(type, zodSchema)` registers each event type into a global Map. This answers "what events exist?" at the type-system level. Without this layer, the bus would accept arbitrary string keys and unvalidated payloads — the classic Event Bus pitfall ("이벤트가 너무 많아지면 복잡해짐").

**`src-bus-index.ts` — Local typed dispatch**

Implements two-tier dispatch with Effect-TS PubSub (see below). Handles typed subscriptions and wildcard subscriptions within a single instance (directory). After dispatching locally, it forwards every event to `GlobalBus.emit()`.

**`global.ts` — Global propagation**

A plain Node.js `EventEmitter` with no Effect dependency. Exists because `Bus.Service` is scoped per instance — when multiple projects are open, each has its own `Bus.Service`. `GlobalBus` is the single process-level bus that crosses instance boundaries. It only forwards; it never processes.

## Two-tier dispatch — Observer optimized for type filtering

```ts
type State = {
  wildcard: PubSub<Payload>; // receives every event
  typed: Map<string, PubSub<Payload>>; // one PubSub per event type, created lazily
};
```

`publish()` always writes to both channels:

```ts
if (ps) yield * PubSub.publish(ps, payload); // typed (subscribers for this type only)
yield * PubSub.publish(s.wildcard, payload); // wildcard (all-event subscribers)
```

Without this split, every `publish()` must scan all subscribers regardless of type — O(total subscribers). With the split, typed dispatch is O(subscribers for that type).

## Push vs Pull — two Observer delivery modes

Both appear in opencode:

- **Push** (`subscribeCallback`): bus drives delivery, calls callback. Simpler to write; opencode wraps with `Effect.tryPromise` so a failing callback doesn't crash the dispatch loop.
- **Pull** (`subscribe` returning `Stream`): consumer drives consumption. Natural fit for async pipelines; backpressure is handled by the stream infrastructure, not the bus.

## Event flow (end-to-end)

```
BusEvent.define("server.instance.disposed", z.object({...}))
  ↓ registered in registry (bus-events.ts)

Bus.publish(InstanceDisposed, { directory: "/foo" })
  ↓
  typed["server.instance.disposed"] PubSub → typed subscribers (Push or Pull)
  wildcard PubSub                          → wildcard subscribers (Push or Pull)
  GlobalBus.emit("event", {...})           → process-level propagation (global.ts)
```

## Evidence

From [[knowledge/reviews/opencode-bus]]:

- `bus-events.ts` `registry` Map — Registry that backs the entire contract layer
- `State.wildcard` + `State.typed` (`src-bus-index.ts:27-28`) — two-tier structure
- `publish()` (`src-bus-index.ts:86-107`) — dispatches typed first, then wildcard, then GlobalBus
- `global.ts` — plain EventEmitter as the process-level escape hatch

## Related

- [[knowledge/concepts/observer]] — the underlying mechanism
- [[knowledge/reviews/opencode-bus]] — evidence source (bus-events.ts, global.ts, src-bus-index.ts)
