---
title: "Observer / Event Bus"
aliases: ["Pub-Sub", "Event Listener", "Event-Driven Architecture"]
tags: [behavioral]
sources:
  - "https://refactoring.guru/design-patterns/observer"
  - "https://www.geeksforgeeks.org/system-design/event-driven-architecture-system-design/"
  - "knowledge/reviews/opencode-bus"
created: 2026-04-14
updated: 2026-04-22
---

# Observer / Event Bus

The Observer pattern is a behavioral design pattern that lets you define a subscription mechanism to notify multiple objects about any events that happen to the object they're observing. It establishes a one-to-many relationship where multiple observer objects watch a subject, and when the subject's state changes, all observers are automatically notified.

When the Subject role is extracted into a shared singleton (the Bus), Observer becomes **Event Bus** — the foundation of **Event-Driven Architecture (EDA)**: a system design where components communicate exclusively through events rather than direct calls.

## Intent

- Define a one-to-many dependency so that when one object changes state, all dependents are notified automatically
- Separate the subject (observable) from its observers, decoupling them
- Allow dynamic subscription and unsubscription at runtime
- In EDA: enable independent components to react to system state changes without knowing each other

## Structure

Four key participants (Observer pattern):

1. **Subject** — maintains a list of observers; notifies all observers on state change
2. **Observer** — defines the notification interface
3. **Concrete Subject** — stores state and triggers notifications
4. **Concrete Observer** — implements the notification interface; reacts to updates

Five key components (Event Bus / EDA):

1. **Event Source** — generates events from significant actions (e.g., user clicks "confirm booking")
2. **Event** — represents a meaningful occurrence or state change; carries a type and payload
3. **Event Broker / Bus** — central hub that routes events from publishers to all matching subscribers
4. **Publisher** — emits events asynchronously; does not know who is listening
5. **Subscriber** — registers interest in specific event types; reacts independently of other subscribers

Supporting roles: **Event Handlers** (define response logic per subscriber), **Dispatchers** (route events to the right handlers), **Listeners** (monitor for relevant events).

## When to use

- A change to one object requires changing others, and the number of objects is unknown beforehand
- An object should notify others without knowing who they are
- You need dynamic subscription/unsubscription at runtime
- Multiple independent services must react to the same trigger without being coupled (EDA context)
- Real-time responsiveness is required across distributed components

## When NOT to use

- Observers are fixed and known at compile time (direct method calls are simpler)
- Observer callbacks have side effects that require strict ordering (notification order is unpredictable)
- Performance is critical and per-notification overhead is unacceptable
- Strong consistency between components is required — EDA is eventually consistent by nature

## Delivery modes

Two variants, both seen in [[knowledge/reviews/opencode-bus]]:

- **Push**: the Subject calls a callback on each observer — bus drives delivery. Simple to write, but a slow or failing observer can block the dispatch loop. opencode wraps callbacks in `Effect.tryPromise` to prevent cascade failures.
- **Pull**: the Subject exposes a `Stream`; the observer consumes events at its own pace. Natural for async pipelines; backpressure is handled by the stream infrastructure, not the Subject.

## Pros and Cons

### Pros

- Open/Closed Principle — introduce new observers without modifying the Subject or Publisher
- Loose coupling — publishers and subscribers are unaware of each other's concrete types
- Dynamic subscriptions at runtime
- Real-time responsiveness and scalability across independent services

### Cons

- Notification order is unpredictable
- Memory leaks if observers are not properly unsubscribed
- Difficult to trace event flow when observers are numerous
- Event ordering and consistency issues in distributed systems
- Debugging is harder in async environments — no single call stack to follow
- Latency between event occurrence and subscriber response

## Real-world applications

- **Financial services**: fraud detection triggers on transaction events; each detector subscribes independently
- **E-commerce**: order placed → inventory, notification, analytics, shipping all react via bus
- **Telecommunications**: network monitoring events fan out to alerting, logging, and failover systems
- **Online gaming**: player actions broadcast to game state, leaderboard, and opponent clients
- **Flight booking** (practice scenario): `booking.confirmed` → payment, mileage, baggage, boarding pass

## Real examples seen

- [[knowledge/reviews/opencode-bus]] — three-layer Event Bus: Registry (`bus-events.ts`), local typed dispatch (`src-bus-index.ts`), global propagation (`global.ts`)

## Sources

- https://refactoring.guru/design-patterns/observer
- https://www.geeksforgeeks.org/system-design/event-driven-architecture-system-design/
- [[knowledge/reviews/opencode-bus]]
