---
title: "Observer"
aliases: ["Pub-Sub", "Event Listener"]
tags: [behavioral]
sources:
  - "https://refactoring.guru/design-patterns/observer"
  - "knowledge/reviews/opencode-bus"
created: 2026-04-14
updated: 2026-04-19
---

# Observer

The Observer pattern is a behavioral design pattern that lets you define a subscription mechanism to notify multiple objects about any events that happen to the object they're observing. It establishes a one-to-many relationship where multiple observer objects watch a subject, and when the subject's state changes, all observers are automatically notified.

## Intent

The intent of the Observer pattern is to:

- Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified automatically
- Separate the subject (observable) from its observers, decoupling them
- Allow dynamic subscription and unsubscription of observers at runtime

## Problem

When an object needs to notify other objects about state changes, it must maintain tight coupling to all observers. Adding new observers requires modifying the subject class. Unsubscribing becomes difficult because the subject holds direct references to observers. When observers have different notification needs, the subject must know about all variations.

## Solution

The Observer pattern introduces a subscription mechanism where observers register themselves with the subject. When the subject's state changes, it iterates through all registered observers and calls their notification method. Observers can subscribe and unsubscribe dynamically. The subject does not need to know concrete observer types, only that they implement the observer interface.

## Structure

Four key participants:

1. **Subject** — maintains a list of observers and provides methods to attach/detach them; notifies all observers of state changes
2. **Observer** — defines the interface for objects that should be notified of subject changes
3. **Concrete Subject** — stores state and sends notifications to observers
4. **Concrete Observer** — stores a reference to the subject and implements the observer interface; receives updates from the subject

## When to use

- A change to one object requires changing others, and the number of objects is unknown beforehand
- An object should notify other objects without assuming who those objects are
- You want a loosely coupled architecture where objects communicate indirectly
- You need dynamic subscription/unsubscription of observers at runtime

## When NOT to use

- The number of observers is fixed and known at compile time (direct method calls may be simpler)
- You need guaranteed immediate notification (observers are notified asynchronously, which introduces delay)
- Observer callbacks have side effects that require careful ordering (unpredictable notification order)
- Performance is critical and observer notification overhead is unacceptable

## Real examples seen

- Event listeners in GUI frameworks (buttons notify click handlers)
- Pub-Sub messaging systems (message brokers notify subscribers)
- MVC frameworks (model notifies view of changes)
- Real-time event buses in distributed systems ([[knowledge/reviews/opencode-bus]] — typed and wildcard event subscriptions)

## Connections

- **Related to:** [[knowledge/concepts/mediator]] — both decouple objects, but Mediator centralizes communication while Observer distributes it
- **Often combined with:** [[knowledge/concepts/event-bus]] — higher-level abstraction over Observer
- **Similar to:** [[knowledge/concepts/command]] — both support undo/redo through event notifications
- **Enhanced by:** [[knowledge/concepts/iterator]] — to traverse observers safely

## Pros and Cons

### Pros

- Open/Closed Principle — introduce new observers without changing subject
- Loose coupling — subject and observers don't need to know details about each other
- Dynamic subscriptions — observers can be added/removed at runtime
- Runtime flexibility — subject doesn't need to know concrete observer types

### Cons

- Observers are notified in unpredictable order
- Memory leaks if observers aren't properly unsubscribed
- Performance overhead if there are many observers
- Difficult to trace notification order and dependencies between observers

## Observer delivery modes

Two variants exist, both seen in [[knowledge/reviews/opencode-bus]]:

- **Push**: the Subject calls a callback on each observer — bus drives delivery. Simple but observer errors can affect the dispatch loop.
- **Pull**: the Subject exposes a `Stream`; the observer pulls events at its own pace. Natural for async pipelines; backpressure is handled by stream infrastructure.

## Event Bus variant

When the Subject role is extracted into a shared singleton (the Bus), Observer becomes **Event Bus**. Producers call `publish(type, payload)` without holding any observer list. Consumers `subscribe(type)` without knowing any producer. Both sides only know the event type contract. See [[knowledge/connections/observer-event-bus]] for the full structural comparison.

> **Updated 2026-04-19:** Added Push vs Pull delivery modes and Event Bus variant, from opencode bus analysis.

## Sources

- https://refactoring.guru/design-patterns/observer
- [[daily/2026-04-19.md]] — Push/Pull variants, Event Bus as Observer specialization, two-tier dispatch
