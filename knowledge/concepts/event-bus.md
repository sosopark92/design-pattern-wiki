---
title: "Observer"
aliases: ["Pub-Sub", "Event Listener"]
tags: [behavioral]
sources:
  - "https://refactoring.guru/design-patterns/observer"
  - "knowledge/reviews/opencode-bus"
created: 2026-04-14
updated: 2026-04-21
---

# Observer

The Observer pattern is a behavioral design pattern that lets you define a subscription mechanism to notify multiple objects about any events that happen to the object they're observing. It establishes a one-to-many relationship where multiple observer objects watch a subject, and when the subject's state changes, all observers are automatically notified.

## Intent

- Define a one-to-many dependency so that when one object changes state, all dependents are notified automatically
- Separate the subject (observable) from its observers, decoupling them
- Allow dynamic subscription and unsubscription at runtime

## Structure

Four key participants:

1. **Subject** — maintains a list of observers; notifies all observers on state change
2. **Observer** — defines the notification interface
3. **Concrete Subject** — stores state and triggers notifications
4. **Concrete Observer** — implements the notification interface; reacts to updates

## When to use

- A change to one object requires changing others, and the number of objects is unknown beforehand
- An object should notify others without knowing who they are
- You need dynamic subscription/unsubscription at runtime

## When NOT to use

- Observers are fixed and known at compile time (direct method calls are simpler)
- Observer callbacks have side effects that require strict ordering (notification order is unpredictable)
- Performance is critical and per-notification overhead is unacceptable

## Delivery modes

Two variants, both seen in [[knowledge/reviews/opencode-bus]]:

- **Push**: the Subject calls a callback on each observer — bus drives delivery. Simple to write, but a slow or failing observer can block the dispatch loop. opencode wraps callbacks in `Effect.tryPromise` to prevent cascade failures.
- **Pull**: the Subject exposes a `Stream`; the observer consumes events at its own pace. Natural for async pipelines; backpressure is handled by the stream infrastructure, not the Subject.

## Event Bus variant

When the Subject role is extracted into a shared singleton (the Bus), Observer becomes **Event Bus**. Producers call `publish(type, payload)` without holding any observer list. Consumers `subscribe(type)` without knowing any producer. Both sides only know the event type contract — enforced in opencode via `BusEvent.define()` and Zod schemas.

See [[knowledge/connections/observer-event-bus]] for the full structural comparison and the three-layer architecture seen in opencode.

## Pros and Cons

### Pros

- Open/Closed Principle — introduce new observers without modifying the Subject
- Loose coupling — Subject and observers are unaware of each other's concrete types
- Dynamic subscriptions at runtime

### Cons

- Notification order is unpredictable
- Memory leaks if observers are not properly unsubscribed
- Difficult to trace event flow when observers are numerous

## Real examples seen

- [[knowledge/reviews/opencode-bus]] — three-layer Event Bus: Registry (`bus-events.ts`), local typed dispatch (`src-bus-index.ts`), global propagation (`global.ts`)

## Sources

- https://refactoring.guru/design-patterns/observer
- [[knowledge/reviews/opencode-bus]]
