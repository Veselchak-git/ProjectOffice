# Glossary Format

## Structure

```md
# Glossary

One or two sentences describing what this glossary covers.

## Language

**TabManager**: Infrastructure container for application tabs.
_Avoid_: tab store, page store

**tab-local state**: State that belongs to one concrete tab instance.
_Avoid_: page global state

## Relationships

- A **TabManager** stores many **tab instances**.
- A **tab instance** has exactly one **fullPath** and one **kind**.

## Example Dialogue

> **Dev:** "Should filters for the users page live in global state?"
> **Domain expert:** "No - they belong to the users tab-local state."

## Flagged Ambiguities

- "tab type" was used to mean both **kind** and a React route component - resolved: use **kind** for tab state contract.
```

## Rules

- Be opinionated. When multiple words exist for the same concept, pick the best one and list others as aliases to avoid.
- Flag conflicts explicitly in `Flagged Ambiguities` with a clear resolution.
- Keep definitions tight. Define what the term is, not every detail of what it does.
- Show relationships between terms where useful.
- Only include terms specific to this project's context. General programming concepts do not belong.
- Group terms under subheadings when natural clusters emerge.

## File Placement

System-wide project language lives in:

```text
docs/architecture/glossary.md
```

Package- or application-specific language lives near the affected package or application:

```text
apps/nms-frontend/docs/architecture/glossary.md
packages/ui-kit/docs/architecture/glossary.md
```
