---
title: "Review: opencode-bus"
source_type: github
language: TypeScript
reviewed: 2026-04-14
source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/bus/index.ts
---

# Review: opencode-bus

## What this code does

The opencode Bus is a type-safe, Effect-based event bus implementation that provides publish-subscribe functionality for inter-process event communication. It supports both typed event subscriptions (for specific event types) and wildcard subscriptions (for all events), with a two-tier dispatch mechanism for efficiency.

## Patterns identified

### **[[knowledge/concepts/observer]]** — Core pattern

- **Subject:** `Bus.Service` maintains state (PubSub instances)
- **Observers:** Callbacks and Stream consumers subscribe to typed or wildcard events
- **Notification:** `publish()` dispatches events to all subscribed observers
- Bidirectional: both Stream-based (`subscribe()`) and callback-based (`subscribeCallback()`) observer styles

### **Event Bus** — Higher-level pattern

- Centralizes all event handling in a single service
- Supports both producer-push (via `publish()`) and consumer-pull (via Stream)
- Decouples event producers from consumers completely
- Provides both synchronous (callback) and streaming (async) consumption modes

### **Registry Pattern** — Event type management

- `BusEvent.define()` registers event types globally
- Each defined event has a string type and validated properties payload via Zod
- `BusEvent.payloads()` constructs a discriminated union of all registered event types
- Type-safe validation of event data at definition time

### **Two-tier Dispatch** — Performance optimization

- **Wildcard channel** (`s.wildcard`): PubSub that receives ALL events
- **Typed channels** (`s.typed`): Per-event-type PubSub for specific subscriptions
- Subscribers can listen to either all events or specific types
- Reduces overhead: wildcard subscribers don't need individual type channels

### **Resource Management** (Effect pattern)

- Uses `InstanceState` to manage lifecycle
- `Effect.addFinalizer()` ensures cleanup: `InstanceDisposed` event published before shutdown
- All PubSub instances are properly shut down on disposal
- `Scope.make()` ensures subscription resources are released when unsubscribed

## Strengths

- **Type-safe**: Zod schemas enforce event payload types at compile time and runtime
- **Flexible subscription**: Both Stream and callback interfaces for different use cases
- **Efficient**: Two-tier dispatch avoids wasteful fan-out for wildcard subscribers
- **Proper cleanup**: Finalizers ensure no resource leaks; explicit unsubscription support
- **Global integration**: `GlobalBus.emit()` extends events beyond the local instance
- **Logging**: Built-in logging for debugging subscription/publication flow
- **Error handling**: Subscriber callbacks wrapped in `Effect.tryPromise` to prevent cascade failures

## Suggestions

- **Add unsubscription tracking**: Consider warning if subscribers forget to call the returned cleanup function
- **Backpressure handling**: Large event volumes could overwhelm slow subscribers; consider buffering/dropping policies
- **Event ordering guarantees**: Document whether event order is guaranteed within a single type channel
- **Typed wildcard subscriptions**: The wildcard channel uses `any` type; consider creating a base event type that all events extend
- **Subscriber error recovery**: Current error handling logs and ignores; consider retry strategies for transient failures

## Diagnosis

**This is well-designed code.** The opencode Bus demonstrates mature pattern usage: it combines Observer (core subscription mechanism) with Event Bus (higher-level abstraction), Registry (metadata management), and proper resource management (Effect lifecycle). The two-tier dispatch is a smart optimization that many event buses lack. Type safety through Zod throughout the pipeline prevents entire classes of runtime errors. The implementation respects Effect-TS principles for resource management, and the dual interface (Stream + callback) provides flexibility for different consumer needs.

The main area for improvement is documentation around event ordering guarantees and guidance on backpressure handling for high-volume scenarios. The code is production-ready and serves as a good reference implementation of Observer + Event Bus patterns in a modern TypeScript/Effect context.
