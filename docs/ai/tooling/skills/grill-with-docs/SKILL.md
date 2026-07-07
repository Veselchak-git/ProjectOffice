---
name: grill-with-docs
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation (`docs/architecture/glossary.md`, ADRs) inline as decisions crystallise. Use when user wants to stress-test a plan against their project's language and documented decisions.
---

# Grill With Docs

Interview me relentlessly about every aspect of this plan until we reach a shared understanding.
Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.
For each question, provide your recommended answer.

Use AskUserQuestion or other tool for interactive questions

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

All generated files (glossary, ADR, spec) must be written in Russian.

## Invocation Modes

### With a question/plan (no file)

The user invokes the skill describing a plan or task.
Run the grill session as usual.
When the session finishes, offer to save the resulting plan in `docs/ai/spec/` using the format `YYYY-MM-DD-short-task-name.md`.

### With a file reference

The user invokes the skill and points to a specific file to review.
At the start of the session ask:

1. Should changes be applied directly to the source file?
2. Should a separate spec/plan be created in `docs/ai/spec/`?

Act according to the answers. If the source file is to be modified, edit it as the session progresses.
If a spec is requested, use the format `YYYY-MM-DD-short-task-name.md`.

## Domain Awareness

During codebase exploration, also look for existing documentation.

### File Structure

System-wide project language and architectural decisions live under `docs/architecture`:

```text
/
├── docs/
│   └── architecture/
│       ├── glossary.md
│       └── adr/
│           ├── 0001-redux-toolkit-router-centric-tab-lifecycle.md
│           └── 0002-example-decision.md
└── src/
```

Package- or application-specific language and decisions live near the affected package or application:

```text
/
├── docs/
│   └── architecture/
│       ├── glossary.md                       # system-wide language
│       └── adr/                              # system-wide decisions
├── apps/
│   └── nms-frontend/
│       └── docs/
│           └── architecture/
│               ├── glossary.md              # frontend-specific language
│               └── adr/                      # frontend-specific decisions
└── packages/
    └── ui-kit/
        └── docs/
            └── architecture/
                ├── glossary.md              # ui-kit-specific language
                └── adr/                      # ui-kit-specific decisions
```

Create files lazily - only when you have something to write.
If no relevant `glossary.md` exists, create one when the first term is resolved.
If no relevant `adr/` directory exists, create it when the first ADR is needed.

## During The Session

### Challenge Against The Glossary

When the user uses a term that conflicts with existing language in the relevant `glossary.md`, call it out immediately:

> Your glossary defines "tab-local state" as X, but you seem to mean Y - which is it?

### Sharpen Fuzzy Language

When the user uses vague or overloaded terms, propose a precise canonical term:

> You're saying "tab type" - do you mean `kind` or the React component rendered by the route? Those are different things.

### Discuss Concrete Scenarios

When domain relationships are being discussed, stress-test them with specific scenarios.
Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-Reference With Code

When the user states how something works, check whether the code agrees.
If you find a contradiction, surface it:

> The docs say `TabManager` is infrastructure only, but this code path adds feature-specific behavior there - which one is intended?

### Update Glossary Inline

When a term is resolved, update the relevant `glossary.md` right there.
Do not batch these up - capture them as they happen.
Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).

`glossary.md` should be a glossary, not a spec, scratch pad, or implementation decision log.
Keep implementation details out unless they are necessary to distinguish a project-specific term from a general programming concept.

### Offer ADRs Sparingly

Only offer to create an ADR when all three are true:

1. Hard to reverse - the cost of changing your mind later is meaningful.
2. Surprising without context - a future reader will wonder "why did they do it this way?"
3. The result of a real trade-off - there were genuine alternatives and you picked one for specific reasons.

If any of the three is missing, skip the ADR.
Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

Relevant ADRs live next to the affected architectural context:

- system-wide decisions: `docs/architecture/adr/`;
- frontend-specific decisions: `apps/nms-frontend/docs/architecture/adr/`;
- ui-kit-specific decisions: `packages/ui-kit/docs/architecture/adr/`.

Use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc.
Scan the relevant `adr/` directory for the highest existing number and increment by one.
