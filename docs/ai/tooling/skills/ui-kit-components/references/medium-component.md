# Medium UI Kit Component

Example of a medium component in `packages/ui-kit/src/components`.

Mandatory rules are defined in `packages/ui-kit/docs/architecture/ui-kit-components.md`. If this example conflicts with the architecture document, follow the architecture document.

## When to Use

Use this structure when the component has internal UI parts, hooks, context, or pure utilities, but does not yet have independent subsystems.

## Structure

```text
components/
  Combobox/
    Combobox.tsx
    Combobox.css
    types.ts
    index.ts

    ui/
      ComboboxInput.tsx
      ComboboxList.tsx
      ComboboxOption.tsx

    hooks/
      useComboboxKeyboard.ts
      useComboboxSelection.ts

    context/
      ComboboxContext.tsx
      ComboboxProvider.tsx
      useComboboxContext.ts

    lib/
      normalizeOptions.ts
      isOptionSelected.ts

    stories/
      Combobox.stories.tsx

    tests/
      Combobox.test.tsx
      useComboboxKeyboard.test.tsx
      normalizeOptions.test.ts
```

## Rules

- Put internal React components and UI primitives in `ui`.
- Put React hooks in `hooks`.
- Put React Context, providers, and context access hooks in `context`.
- Put pure functions without React in `lib`.
- Do not put React components, hooks, providers, or context in `lib`.
- Do not create `model` unless there is a store, reducer, state machine, registry, or explicit data model.
- Export only the public API through `index.ts`.
