# CSS Token Examples

Use these examples together with `packages/ui-kit/docs/architecture/css-tokens-rules.md`.

## Basic Component Tokens

Component token names use the format `--<component>[-<part>][-<state>]-<property>`.

```css
@layer components {
    .ui-kit-button {
        min-height: var(--btn-min-height, calc(var(--spacing) * 6));
        border-radius: var(--btn-border-radius, calc(var(--spacing) * 1.5));
        background-color: var(--btn-bg, var(--neutral-500));
        color: var(--btn-text, var(--neutral-50));
    }
}
```

Use one component prefix consistently. `--btn-*` and `--button-*` are both allowed patterns, but a single component should not mix them.

## States

State goes before the property.

```css
@layer components {
    .ui-kit-button {
        &:hover {
            background-color: var(--btn-hover-bg, var(--neutral-400));
        }

        &:active {
            background-color: var(--btn-active-bg, var(--neutral-600));
        }

        &:disabled {
            background-color: var(--btn-disabled-bg, var(--neutral-600));
            color: var(--btn-disabled-text, var(--neutral-200));
        }
    }
}
```

Use `--btn-hover-bg`, not `--btn-bg-hover`.

## Parts

Use `part` when the token belongs to a named component area instead of the whole component.

```css
@layer components {
    .ui-kit-select__popup {
        border-color: var(--select-popup-border-color, var(--neutral-700));
        background-color: var(--select-popup-bg, var(--neutral-900));
        color: var(--select-popup-text, var(--neutral-50));
    }

    .ui-kit-dialog__backdrop {
        background-color: var(--dialog-backdrop-bg, rgb(20 20 28 / 58%));
    }
}
```

## Variants

Variants set existing component tokens. They do not introduce variant-specific token names.

```css
@layer components {
    .ui-kit-button {
        &.ui-kit-btn-success {
            --btn-bg: var(--green-500);
            --btn-hover-bg: color-mix(
                in srgb,
                var(--green-500) 82%,
                var(--neutral-50)
            );
            --btn-active-bg: color-mix(
                in srgb,
                var(--green-500) 78%,
                var(--neutral-950)
            );
            --btn-disabled-bg: color-mix(
                in srgb,
                var(--green-500) 45%,
                var(--neutral-700)
            );
            --btn-text: var(--neutral-50);
            --btn-disabled-text: var(--neutral-200);
        }
    }
}
```

Do not create `--btn-success-bg` unless a separate architecture decision explicitly changes the token contract.

## Surface Overrides

Surfaces override existing component tokens for a DOM area.

```css
.some-surface {
    --table-bg: transparent;
    --table-header-bg: var(--neutral-700);
    --table-hover-row-bg: var(--neutral-700);
    --checkbox-color: var(--neutral-50);
    --checkbox-disabled-color: var(--neutral-300);
}
```

Do not encode the surface name into the token, for example `--table-dark-bg`.
