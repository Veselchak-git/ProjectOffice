# Large UI Kit Component

Example of a large component in `packages/ui-kit/src/components`.

Mandatory rules are defined in `packages/ui-kit/docs/architecture/ui-kit-components.md`. If this example conflicts with the architecture document, follow the architecture document.

## When to Use

Use this structure when:

- the component has several independent subsystems;
- flat `ui`, `hooks`, `model`, or `lib` segments already hurt navigation;
- there is a store, reducer, state machine, registry, or explicit data model.

## Structure

```text
components/
  Table/
    Table.tsx
    Table.css
    types.ts
    index.ts

    ui/
      header/
        HeaderCell.tsx
        SortIndicator.tsx
      body/
        TableRow.tsx
        TableCell.tsx

    hooks/
      useTableFilters.ts
      useTableSort.ts

    context/
      TableContext.tsx
      TableProvider.tsx
      useTableContext.ts

    model/
      selection/
        selectionReducer.ts
        selectionTypes.ts
      column-sizing/
        columnSizingReducer.ts
        columnSizingTypes.ts

    lib/
      buildColumnDefs.ts
      getDefaultRowId.ts

    stories/
      Table.stories.tsx

    tests/
      Table.test.tsx
      useTableSort.test.ts
      buildColumnDefs.test.ts
      selectionReducer.test.ts
```

## Rules

- Use nested groups only when they represent real subsystems.
- Do not create nesting in advance for symmetry.
- Put stores, reducers, state machines, registries, and model contracts in `model`.
- Do not use `model` as a folder for arbitrary hooks.
- Keep context separate from `model` when it is React Context, a provider, or a context access hook.
- Keep pure utilities in `lib`.
- Export only the public API through `index.ts`.
