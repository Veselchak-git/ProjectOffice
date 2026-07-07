# Small UI Kit Component

Example of a small component in `packages/ui-kit/src/components`.

Mandatory rules are defined in `packages/ui-kit/docs/architecture/ui-kit-components.md`. If this example conflicts with the architecture document, follow the architecture document.

## When to Use

Use this structure when:

- the component has one main public component;
- additional root files are part of the same public component family;
- there are no internal React parts, context, state model, hooks, or utilities.

## Structure

```text
components/
  Button/
    Button.tsx
    ButtonVariant.tsx
    Button.css
    types.ts
    index.ts

    stories/
      Button.stories.tsx

    tests/
      Button.test.tsx
```

## Rules

- Do not create `ui`, `hooks`, `context`, `model`, or `lib` in advance.
- Keep public components from the same component family in the component root.
- Keep tests only in `tests/`.
- Keep Storybook files only in `stories/`.
- Export the public API through `index.ts`.
