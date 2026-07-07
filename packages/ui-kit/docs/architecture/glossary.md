# Glossary

Глоссарий фиксирует язык CSS-токенов и surface-механики в `packages/ui-kit`. Термины применяются к документации и CSS-контрактам UI Kit.

## Language

**primitive token**: Базовый токен из `packages/ui-kit/src/styles/tokens.css`, который задаёт исходное значение палитры, типографики, отступа или другого фундаментального параметра.
_Avoid_: palette token, colors token

**semantic token**: Промежуточный токен из `tokens.css` с префиксом `--semantic-`, который связывает назначение в дизайне (текст, фон, состояние кнопки) с primitive token и переключается между темами через `data-color-mode`.
_Avoid_: theme token, design token

**component token**: CSS custom property компонента, которая описывает переопределяемое визуальное решение через назначение, часть компонента и состояние.
_Avoid_: component variable

**component prefix**: Выбранный префикс компонента в имени component token, например `btn`, `button`, `select` или `table`.
_Avoid_: namespace компонента

**part**: Именованная часть компонента внутри component token, если токен относится не ко всему компоненту, а к его фрагменту.
_Avoid_: subcomponent token, element token

**state**: Визуальное состояние component token, например `hover`, `active`, `disabled`, `focus` или `invalid`.
_Avoid_: modifier

**surface**: DOM-область, которая переопределяет component tokens вложенных компонентов для группового изменения внешнего вида.
_Avoid_: theme class, wrapper theme

## Relationships

- **primitive token** не зависит от темы.
- **semantic token** маппится на **primitive token** и переключается атрибутом `data-color-mode` на `documentElement`.
- **component token** использует один **component prefix**.
- **part** и **state** являются необязательными частями имени **component token**.
- **component token** ссылается на **semantic token**; **semantic token** — на **primitive token**.
- **primitive token** остаётся предпочтительным фолбеком в `var()` на уровне component token.
- **surface** переопределяет существующие **component tokens**, но не вводит отдельную схему имён.

## Example Dialogue

> **Dev:** "Нужно ли заводить `--btn-success-bg` для зелёной кнопки?"
> **Domain expert:** "Нет. `success` переопределяет существующий component token `--btn-bg` внутри CSS-класса варианта."

## Flagged Ambiguities

- `--palette-*` и `--colors-*` встречаются в текущем коде, но не являются каноническими primitive tokens для правил CSS-токенов UI Kit.
- `--field-anchor-*`, `--overlay-*` и похожие legacy shared tokens встречаются в текущем коде, но не входят в канонический набор `--semantic-*` из Figma.
