# Правила использования CSS-переменных в компонентах UI Kit

Документ описывает обязательные правила работы с CSS custom properties (токенами) при создании и изменении компонентов в `packages/ui-kit`.

## Принцип

Токены организованы в три слоя:

1. **Primitive tokens** (`--neutral-*`, `--accent-*`, …) — стабильная палитра, не зависит от темы.
2. **Semantic tokens** (`--semantic-*`) — назначение из Figma, маппинг на primitives, переключается через `data-color-mode="light" | "dark"`.
3. **Component tokens** (`--btn-bg`, `--select-popup-bg`, …) — переопределяемые свойства конкретного компонента.

Каждый компонент использует **component tokens** — CSS-переменные, имена которых описывают назначение, часть компонента и состояние, а не конкретное визуальное значение. Это даёт два механизма переопределения:

1. **Точечное** — потребитель задаёт значение токена на любом уровне DOM, не повышая специфичность CSS-селекторов.
2. **Групповое** — surface переопределяет токены сразу для всех вложенных компонентов.

## Именование токенов

Формат: `--<component>[-<part>][-<state>]-<property>`.

| Часть       | Описание                                                                | Пример                                 |
| ----------- | ----------------------------------------------------------------------- | -------------------------------------- |
| `component` | выбранный префикс компонента без `ui-kit-`                              | `btn`, `button`, `select`, `table`     |
| `part`      | именованная часть компонента, если свойство относится не ко всему блоку | `popup`, `backdrop`, `header`, `cell`  |
| `state`     | визуальное состояние; ставится перед свойством и опускается для default | `hover`, `active`, `disabled`, `focus` |
| `property`  | визуальное свойство или параметр                                        | `bg`, `text`, `border-color`, `shadow` |

`component` может быть коротким (`btn`) или полным (`button`), но внутри одного компонента нужно выбрать один префикс и не смешивать варианты. Для уже существующих компонентов сохраняется текущий опубликованный префикс, если отдельная миграция не решила иначе.

Примеры:

```css
--btn-bg
--btn-hover-bg
--btn-active-bg
--btn-disabled-text
--btn-border-radius
--select-focus-border-color
--select-popup-bg
--dialog-backdrop-bg
--table-header-text
--table-hover-row-bg
--combobox-chip-remove-hover-bg
```

Состояние всегда идёт перед `property`: правильно `--btn-hover-bg`, неправильно `--btn-bg-hover`.

## Semantic Tokens

Semantic tokens объявляются в `packages/ui-kit/src/styles/tokens.css` с префиксом `--semantic-` и переключаются атрибутом `data-color-mode` на `documentElement`.

Формат: `--semantic-<scope>[-<part>][-<state>]-<property>`.

| Figma Variable                                 | CSS-токен                                   |
| ---------------------------------------------- | ------------------------------------------- |
| `semantic/text/primary`                        | `--semantic-text-primary`                   |
| `semantic/background/surface`                  | `--semantic-bg-surface`                     |
| `semantic/button/accent (fill)/default`        | `--semantic-btn-accent-fill-bg`             |
| `semantic/button/accent (stroke)/hover stroke` | `--semantic-btn-accent-stroke-hover-border` |
| `semantic/focus`                               | `--semantic-focus`                          |

Правила:

- Semantic token всегда ссылается на primitive token: `--semantic-text-primary: var(--neutral-900);`
- Переключение темы реализуется только в semantic-слое, не в CSS компонентов.
- Component token ссылается на semantic token: `--btn-bg: var(--semantic-btn-accent-fill-bg);`
- Фолбек в `var()` на уровне component token остаётся primitive.

## Primitive Tokens И Фолбеки

Каждая переменная компонента **обязана** содержать фолбек:

```css
background-color: var(--btn-bg, var(--neutral-500));
color: var(--btn-text, var(--neutral-50));
border-color: var(--select-focus-border-color, var(--blue-500));
box-shadow: var(--dialog-shadow, 0 0 20px rgb(10 11 13 / 40%));
```

Предпочтительный источник фолбека — primitive token из `tokens.css`: `--neutral-*`, `--green-500`, `--red-500`, `--blue-500`, `--spacing`, `--font-size`, `--font-weight` и другие токены, реально объявленные в этом файле.

Литеральное значение допустимо, если подходящего primitive token ещё нет или значение является локальным техническим параметром компонента: например `z-index`, `blur(8px)`, `min(640px, 100%)`, одноразовая тень или ограничение размера.

Запрещено использовать переменную компонента без фолбека:

```css
/* Запрещено */
background-color: var(--btn-bg);
```

Имена `--palette-*` и `--colors-*` не являются каноном для этого документа. Если такие переменные встречаются в коде, это legacy-расхождение, которое нужно исправлять отдельной миграцией или заменять на актуальные primitive tokens из `tokens.css`.

## Варианты И Размеры Компонентов

Заводить отдельные токены для вариантов компонента **не нужно**. Варианты (`success`, `error`, `primary` и т.д.) реализуются через установку значений базовых component tokens внутри соответствующего CSS-класса:

```css
&.ui-kit-btn-success {
    --btn-bg: var(--green-500);
    --btn-hover-bg: color-mix(in srgb, var(--green-500) 82%, var(--neutral-50));
    --btn-active-bg: color-mix(in srgb, var(--green-500) 78%, var(--neutral-950));
    --btn-disabled-bg: color-mix(in srgb, var(--green-500) 45%, var(--neutral-700));
    --btn-text: var(--neutral-50);
    --btn-disabled-text: var(--neutral-200);
}
```

Вариант не вводит новые имена токенов — он переопределяет значения уже существующих.

Размеры и layout-параметры (`padding`, `min-height`, `border-radius`, ширина popup и т.д.) токенизируются выборочно. Токен нужен, если параметр должен переопределяться извне, зависеть от surface или быть частью публичного CSS-контракта компонента. Обычные size-классы могут задавать значения напрямую.

## Поверхности

Surface — DOM-область, которая задаёт значения component tokens для вложенных компонентов. Surface позволяет изменить внешний вид группы компонентов без точечного переопределения каждого экземпляра.

Документ фиксирует только сам принцип. Текущие имена классов surface и наборы surface-токенов не являются частью этого правила, потому что именование поверхностей и токенов синхронизируется с дизайном отдельно.

Пример принципа:

```css
.some-surface {
    --table-bg: transparent;
    --table-header-bg: var(--neutral-700);
    --checkbox-color: var(--neutral-50);
    --checkbox-disabled-color: var(--neutral-300);
}
```

Если компонент должен визуально реагировать на surface, surface переопределяет его существующие component tokens. Новые имена токенов для surface-варианта компонента не создаются.

## Чеклист Для Разработчика

При создании или изменении CSS компонента:

1. Выбрать один `component`-префикс и использовать его во всех component tokens компонента.
2. Вынести в component tokens визуальные свойства, которые должны переопределяться извне, зависеть от состояния или surface.
3. Использовать формат `--<component>[-<part>][-<state>]-<property>`.
4. Ставить `state` перед `property`: `--btn-hover-bg`, а не `--btn-bg-hover`.
5. Добавлять фолбек к каждому `var(--component-token, ...)`.
6. Использовать semantic tokens для цветов, зависящих от темы; primitive tokens — как фолбек в `var()`.
7. Реализовывать варианты переопределением существующих component tokens, а не созданием вариантных имён.
8. Не дублировать логику темы внутри CSS компонентов — только в `tokens.css`.

## Правила Работы С Figma

### Если В Дизайне Есть Семантические Токены

Когда дизайн-макет в Figma содержит Variables с путями `semantic/...`, разработчик:

1. Переносит их в `--semantic-*` токены в `tokens.css` для light и dark режимов.
2. Маппит каждый semantic token на primitive token.
3. В CSS компонента ссылается на semantic token через component token.

| Figma Variable                          | Semantic token                        | Component token (пример)    |
| --------------------------------------- | ------------------------------------- | --------------------------- |
| `semantic/button/accent (fill)/default` | `--semantic-btn-accent-fill-bg`       | `--btn-bg`                  |
| `semantic/button/accent (fill)/hover`   | `--semantic-btn-accent-fill-hover-bg` | `--btn-hover-bg`            |
| `semantic/text/primary`                 | `--semantic-text-primary`             | —                           |
| `semantic/focus`                        | `--semantic-focus`                    | `--btn-focus-outline-color` |

Маппинг имён из Figma в CSS выполняется в kebab-case. Скобки и слэши заменяются дефисами: `accent (fill)` → `accent-fill`, `hover stroke` → `hover-border`.

### Если В Дизайне Нет Семантических Токенов

Если дизайнер не завёл семантические переменные, а использовал только primitives, разработчик или ИИ формирует component tokens по следующим правилам:

1. Проанализировать части компонента и все состояния в макете: default, hover, active, disabled, focus, invalid и т.д.
2. Для каждого визуального свойства, которое меняется между состояниями или должно переопределяться извне, завести component token по схеме `--<component>[-<part>][-<state>]-<property>`.
3. Подобрать фолбек из фактических primitive tokens в `tokens.css`.
4. Если подходящего primitive token нет, использовать литерал и оставить имя component token семантическим.
5. Результат зафиксировать в CSS компонента.

Пример: дизайнер указал цвета кнопки напрямую — `#585862` для фона, `#70707a` для hover, `#45454e` для active. Разработчик формирует:

```css
background-color: var(--btn-bg, var(--neutral-500)); /* #585862 -> --neutral-500 */

&:hover {
    background-color: var(--btn-hover-bg, var(--neutral-400)); /* #70707a -> --neutral-400 */
}

&:active {
    background-color: var(--btn-active-bg, var(--neutral-600)); /* #45454e -> --neutral-600 */
}
```

### Связь С Поверхностями

Если макет содержит значения одного и того же компонента на разных surfaces, каждый набор значений применяется через переопределение существующих component tokens в соответствующей surface-области.

Surface не меняет схему имени токена. Например, для таблицы на тёмной surface всё равно используются `--table-bg`, `--table-header-bg`, `--table-hover-row-bg`, а не отдельные имена вида `--table-dark-bg`.
