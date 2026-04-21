---
title: "Review: opencode-bus"
source_type: github
language: TypeScript
reviewed: 2026-04-21
source: https://github.com/anomalyco/opencode/tree/dev/packages/opencode/src/bus
snippets:
  - raw/snippets/opencode/bus-events.ts
  - raw/snippets/opencode/global.ts
  - raw/snippets/opencode/src-bus-index.ts
---

# Review: opencode-bus

## What this code does

Three files together implement a type-safe, Effect-based event bus for inter-component communication in opencode. They are not independent — each handles a distinct layer of responsibility: event contract definition, local typed dispatch, and process-level propagation.

## File breakdown

### `bus-events.ts` — Event contract layer

```ts
const registry = new Map<string, Definition>()

export function define<Type, Properties>(type, properties) {
  registry.set(type, result)
  return result
}
```

`define()` registers an event type by pairing a string key with a Zod schema. The global `registry` Map is the canonical catalog of all events that can exist on the bus. `payloads()` turns this catalog into a discriminated union of Zod schemas for validation.

**Pattern: Registry**
The registry answers "what events exist?" at the type-system level. Without it, publishers could emit arbitrary string keys with unvalidated payloads — the classic event bus maintainability problem.

---

### `global.ts` — Process-level propagation layer

```ts
export const GlobalBus = new EventEmitter<{ event: [GlobalEvent] }>()
```

A plain Node.js `EventEmitter` with no Effect dependency. `GlobalEvent` carries `directory`, `project`, `workspace`, and `payload` — enough context to route across instance boundaries.

**Pattern: Observer (minimal form)**
This is the closest file to the textbook Observer pattern: one event type, any number of listeners, no type safety beyond the shape of `GlobalEvent`. Its simplicity is intentional — it is an escape hatch, not the main system.

**Why it exists separately:** `Bus.Service` in `src-bus-index.ts` is scoped per instance (per open directory). When multiple projects are open, each has its own `Bus.Service`. `GlobalBus` is the single singleton that crosses those boundaries. Every event published locally is also forwarded here.

---

### `src-bus-index.ts` — Local dispatch layer

The main implementation. Uses Effect-TS `PubSub` instead of plain callbacks.

**Pattern: Event Bus (Observer with shared Subject)**

```ts
type State = {
  wildcard: PubSub<Payload>
  typed: Map<string, PubSub<Payload>>
}
```

Two-tier dispatch: a dedicated PubSub per event type (`typed`), created lazily on first subscription, plus one shared PubSub for wildcard subscribers. `publish()` always writes to both:

```ts
if (ps) yield* PubSub.publish(ps, payload)  // typed channel
yield* PubSub.publish(s.wildcard, payload)   // wildcard channel
GlobalBus.emit("event", { ... })             // process-level propagation
```

**Pattern: Two-tier Dispatch (performance optimization)**
Without the split, every publish must fan out to all subscribers. With it, type-specific dispatch is O(subscribers for that type). Wildcard subscribers pay one PubSub publish regardless of how many typed channels exist.

**Pattern: Registry (via bus-events.ts)**
`Bus.InstanceDisposed` is defined with `BusEvent.define(...)` at the top of the file — showing how the contract layer is consumed in practice.

**Pattern: Effect lifecycle / Resource Management**
`Effect.addFinalizer()` ensures `InstanceDisposed` is published before shutdown, then all PubSubs are closed. Subscription cleanup uses `Scope.make()` — the returned unsubscribe function calls `Scope.close()`.

**Two subscription interfaces:**
- `subscribe(def)` → `Stream<Payload>` — Pull mode, consumer drives at its own pace, backpressure handled by stream infrastructure
- `subscribeCallback(def, callback)` → `Effect<() => void>` — Push mode, bus drives delivery; wrapped in `Effect.tryPromise` to prevent cascade failures

## Patterns identified

| Pattern | File | Where |
| ------- | ---- | ----- |
| **[[knowledge/concepts/observer]]** | all three | Core subscription mechanism |
| **Event Bus** | `src-bus-index.ts`, `global.ts` | Shared Subject extracted into singleton |
| **Registry** | `bus-events.ts` | `registry` Map + `define()` |
| **Two-tier Dispatch** | `src-bus-index.ts:27-28` | `wildcard` + `typed` PubSub split |
| **Effect lifecycle** | `src-bus-index.ts:56-70` | `InstanceState`, `addFinalizer`, `Scope` |

## Strengths

- **Type-safe end-to-end**: `BusEvent.define()` + Zod means both publish and subscribe fail at compile time if the payload shape is wrong
- **Two delivery modes**: Stream (Pull) and callback (Push) cover different consumer needs without duplicating infrastructure
- **Two-tier dispatch**: avoids O(total subscribers) fan-out for typed events
- **Proper cleanup**: every subscription resource has an explicit finalizer path
- **GlobalBus bridge**: process-level propagation without coupling the main bus to process scope
- **Error isolation**: callback subscribers wrapped in `Effect.tryPromise` — a failing subscriber does not affect others

## Antipatterns / smells

None found. One area to watch:

- `subscribeAll` / `subscribeAllCallback` use `any` for the wildcard payload type. This is a deliberate trade-off (wildcard means "don't filter"), but callers lose type safety on the payload side.

## Suggestions

- Document event ordering guarantees: are events within a single typed channel delivered in publish order? (PubSub semantics suggest yes, but not stated)
- Consider a typed base interface for wildcard payload instead of `any`
- Add guidance on backpressure for high-volume typed channels — the current PubSub is `unbounded`

## Diagnosis

**Well-designed, production-ready code.** The three-file separation is intentional and clean: contract definition, local dispatch, and global propagation each have a single job. The two-tier dispatch is a mature optimization that most event bus implementations skip. Type safety through Zod throughout the pipeline prevents entire classes of runtime errors. The dual interface (Stream + callback) provides real flexibility for different consumer contexts.

The main gap is documentation — event ordering guarantees and backpressure behavior for `unbounded` PubSubs are not stated anywhere in the code.

## Connections

- [[knowledge/concepts/observer]] — Observer is the underlying mechanism for all three files
- [[knowledge/connections/observer-event-bus]] — full structural comparison; three-layer architecture
