---
name: ui-kit-components
description: Use when creating, changing, reviewing, moving, or organizing files in packages/ui-kit/src/components, or when discussing UI kit component structure, public API, tests, stories, hooks, context, model, lib, styles, or component folder conventions in @helpdesk-portal/ui-kit.
---

# UI Kit Components

Use this skill for any task that touches `packages/ui-kit/src/components` or defines rules for UI kit component organization.

## Required Reading

Before making decisions or edits, read:

1. `packages/ui-kit/docs/architecture/ui-kit-components.md` - mandatory component structure rules.
2. `packages/ui-kit/docs/architecture/css-tokens-rules.md` - mandatory CSS custom property naming and fallback rules for component styles.
3. `packages/ui-kit/README.md` - package overview, commands, public API, and development rules.

For new components, component restructuring, or uncertainty about file placement, read the relevant example:

- `references/small-component.md` - simple component without functional segments;
- `references/medium-component.md` - component with internal `ui`, `hooks`, `context`, or `lib`;
- `references/large-component.md` - component with nested groups, `model`, or several independent subsystems.

For component styles or CSS token questions, read:

- `references/css-token-examples.md` - examples of component token names, fallbacks, variants, parts, and surface overrides.

If the current implementation conflicts with these documents, mention the conflict in the report. If the conflict affects public API or architecture, stop and ask the user for clarification.

## Workflow

1. Inspect the affected component folder and nearby components for local patterns.
2. Apply `packages/ui-kit/docs/architecture/ui-kit-components.md` as the source of truth for file placement:
    - root: public component files, styles, `types.ts`, `index.ts`;
    - `ui`: internal React components and UI primitives;
    - `hooks`: React hooks;
    - `context`: React Context, providers, and context access hooks;
    - `model`: store, reducer, state machine, registry, and model contracts;
    - `lib`: pure utilities only;
    - `stories`: Storybook files;
    - `tests`: test files.
3. Apply `packages/ui-kit/docs/architecture/css-tokens-rules.md` as the source of truth for component CSS custom properties.
4. Keep public exports explicit through the component `index.ts` and package public API.
5. Do not expose internal `ui`, `hooks`, `context`, `model`, or `lib` files unless the user explicitly decides they are public API.
6. Keep changes local to `packages/ui-kit` unless the task requires consumer updates.

## Prohibitions

Do not:

- place tests or Storybook files in a component root;
- place React components, hooks, context, or providers in `lib`;
- use `model` as a generic hooks folder;
- create empty segments or segments in advance;
- add business logic, entities, page logic, feature workflows, or dependencies from `apps/*` to UI kit components;
- bypass component public APIs from consumers.

## Validation

After code changes, run checks for the affected block:

```bash
npm run lint --workspace=@nms-monorepo/ui-kit
npm run type-check --workspace=@nms-monorepo/ui-kit
npm run test --workspace=@nms-monorepo/ui-kit
```

Run `npm run build --workspace=@helpdesk-portal/ui-kit` when exports, styles, assets, package build behavior, or generated artifacts may be affected.

If validation is skipped, state why in the final report.
