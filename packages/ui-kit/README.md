# `@helpdesk-portal/ui-kit`

UI-библиотека проекта `helpdesk-portal`.

Пакет предназначен для общих React-компонентов, дизайн-токенов, базовых стилей и вспомогательных UI-утилит, которые переиспользуются в приложениях монорепозитория. Сейчас пакет находится на раннем этапе наполнения: в публичный API уже входят компонент `Button`, CSS-токены и утилита `maxNumber`.

## Технологии

- `React` 19
- `Vite` в режиме library build
- `Base UI` как основа для доступных headless-компонентов
- `TanStack Table` и `TanStack Virtual` для будущих табличных и виртуализированных компонентов
- `Storybook` для разработки и документации компонентов
- `Vitest` для unit-тестов
- нативные CSS variables для дизайн-токенов

## Структура

```text
packages/ui-kit/
├── .storybook/          # конфигурация Storybook
├── src/
│   ├── components/      # публичные React-компоненты
│   ├── styles/          # глобальные CSS-токены и базовые стили
│   ├── utils/           # вспомогательные функции
│   └── index.ts         # публичная точка входа пакета
├── vite.config.ts       # сборка библиотеки и настройки тестов
└── package.json
```

## Публичный API

Основная точка входа:

```ts
import { Button, maxNumber } from "@helpdesk-portal/ui-kit";
```

Стили пакета собираются в отдельный файл:

```ts
import "@helpdesk-portal/ui-kit/styles.css";
```

`src/index.ts` также импортирует `src/styles/base.css` (reset, fonts, tokens, utilities, surfaces), поэтому глобальные стили и CSS-токены попадают в сборку пакета. Consumer-приложению для корректного порядка CSS layers нужно объявить `@layer reset, fonts, tokens, utilities, surfaces, components` до импорта `styles.css` — см. `apps/frontend/src/app/entrypoint/index.css`.

## Команды

Запускать команды можно из корня монорепозитория через workspace:

```bash
npm run lint --workspace=@helpdesk-portal/ui-kit
npm run type-check --workspace=@helpdesk-portal/ui-kit
npm run test --workspace=@helpdesk-portal/ui-kit
npm run build --workspace=@helpdesk-portal/ui-kit
npm run storybook --workspace=@helpdesk-portal/ui-kit
npm run build-storybook --workspace=@helpdesk-portal/ui-kit
```

## Правила разработки

- Экспортируйте наружу только стабильные компоненты, типы и утилиты через `src/index.ts` или ближайший `index.ts` модуля.
- Для каждого публичного компонента держите рядом код, стили, истории Storybook и тесты.
- Не добавляйте глобальные стили в компоненты без необходимости; общие токены размещайте в `src/styles`.
- Используйте CSS variables для дизайн-токенов, чтобы consumer-приложения могли переопределять тему.
- Держите runtime-зависимости приложения в `peerDependencies`, если они должны предоставляться consumer-приложением.
- Новые компоненты на базе внешних UI-библиотек сверяйте с актуальной документацией и существующими локальными паттернами.

## Сборка

Пакет собирается в `dist` как ES-модуль. Внешние зависимости из `peerDependencies`, а также React runtime, исключаются из bundle через `vite.config.ts`.

Публичные артефакты:

- `dist/index.js`
- `dist/index.d.ts`
- `dist/styles.css`

## Связанные документы

- [Архитектура монорепозитория](../../docs/architecture/README.md)
- [Frontend FSD](../../docs/architecture/frontend-fsd.md)
