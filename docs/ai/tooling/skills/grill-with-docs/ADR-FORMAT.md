# ADR Format

## File Placement

Relevant ADRs live next to the affected architectural context:

- system-wide decisions: `docs/architecture/adr/`;
- frontend-specific decisions: `apps/nms-frontend/docs/architecture/adr/`;
- ui-kit-specific decisions: `packages/ui-kit/docs/architecture/adr/`.

Use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc.
Scan the relevant `adr/` directory for the highest existing number and increment by one.

## Template

```md
# ADR-0001: Short Decision Title

## Status

Proposed | Accepted | Deprecated | Superseded

## Context

What situation, constraints, or existing architecture led to this decision.

## Decision

What decision was made.

## Alternatives Considered

Which options were considered and why they were not chosen.

## Consequences

Benefits, trade-offs, technical debt, and impact on affected packages or applications.

## Validation

How the decision is checked in code, tests, documentation, or review.

## Related

- Links to related docs, PRs, issues, code paths, or other ADRs.
```

## When To Offer An ADR

Only offer to create an ADR when all three are true:

1. Hard to reverse - the cost of changing your mind later is meaningful.
2. Surprising without context - a future reader will wonder "why did they do it this way?"
3. The result of a real trade-off - there were genuine alternatives and you picked one for specific reasons.

If any of the three is missing, skip the ADR.

Only include optional detail when it adds genuine value.
The value is recording that a decision was made and why, not filling sections mechanically.
