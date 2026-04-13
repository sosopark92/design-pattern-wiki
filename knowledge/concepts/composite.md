---
title: "Composite"
aliases: ["Object Tree"]
tags: [structural]
sources:
  - "https://refactoring.guru/design-patterns/composite"
created: 2026-04-14
updated: 2026-04-14
---

# Composite

Composite is a structural design pattern that lets you compose objects into tree structures and then work with these structures as if they were individual objects. It enables you to run behavior recursively over all components of an object tree without caring about the concrete classes of the objects that compose the tree.

## Intent

The intent of the Composite pattern is to:

- Compose objects into tree structures to represent part-whole hierarchies
- Let clients treat individual objects and compositions of objects uniformly
- Work with complex tree structures more conveniently using polymorphism and recursion

## Problem

When you have a tree-like object structure (e.g., Products and Boxes where boxes can contain products and other boxes), the direct approach of unwrapping and processing all items becomes complex. You must know the concrete classes, nesting levels, and handle various cases, making the logic awkward or impossible.

## Solution

The Composite pattern suggests working through a common interface that declares methods for performing operations on both simple and complex elements. For simple elements (leaves), the method returns a direct result. For complex elements (containers), the method delegates work to sub-elements recursively, collects results, and returns the aggregated outcome.

## Structure

Four key participants:

1. **Component** — interface that declares operations common to both simple and complex elements
2. **Leaf** — represents simple elements that don't have sub-elements; usually performs the actual work
3. **Container (Composite)** — represents complex elements with sub-elements; delegates work to its children and aggregates their results
4. **Client** — works with all elements through the Component interface

## When to use

- You have to implement a tree-like object structure in your app
- The core model can be represented as a tree with simple leaves and complex containers
- You want client code to treat both simple and complex elements uniformly
- You want to run a single behavior recursively across all elements in a tree without coupling to concrete classes

## When NOT to use

- Your data model cannot be naturally represented as a tree
- You have classes whose functionality differs too much to share a meaningful common interface (would require overgeneralizing the Component interface)
- Tree traversal performance is critical and adding layers of indirection is unacceptable

## Real examples seen

- File systems (directories contain files and other directories)
- GUI component hierarchies (panels contain buttons, text fields, and other panels)
- Military organizational structures (armies contain divisions, divisions contain brigades, etc.)
- Graphical editors with groupable shapes

## Connections

- **Often combined with:** [[knowledge/concepts/visitor]] — to execute operations over the entire tree
- **Often combined with:** [[knowledge/concepts/iterator]] — to traverse the tree structure
- **Often combined with:** [[knowledge/concepts/builder]] — to build complex tree structures
- **Similar structure to:** [[knowledge/concepts/decorator]] — both use recursive composition, but Decorator adds responsibilities while Composite aggregates results
- **Related to:** [[knowledge/concepts/chain-of-responsibility]] — when leaves pass requests up the tree to parent components

## Pros and Cons

### Pros

- Work with complex tree structures more conveniently using polymorphism and recursion
- Open/Closed Principle — introduce new element types without breaking existing code

### Cons

- Difficult to provide a common interface when classes have very different functionality
- May require overgeneralizing the Component interface, making it harder to comprehend
- Client code cannot always distinguish between leaves and containers

## Sources

- https://refactoring.guru/design-patterns/composite
