# Frontend

Frontend-приложение учебного проекта `helpdesk-portal`.

## 1. Стек

- `React`
- `React Router`
- `TypeScript`
- `Vite`
- `Vitest`
- `Testing Library`
- `@tanstack/react-query`
- `@helpdesk-portal/ui-kit`

## 2. Структура

```text
apps/frontend
├── index.html
├── package.json
├── src
│   ├── app          # инициализация приложения, роутер, layout, providers
│   ├── pages        # страницы приложения
│   ├── entities     # доменные сущности и их локальная логика
│   └── shared       # общие утилиты и UI для frontend-приложения
├── tsconfig*.json
└── vite.config.ts
```

Проект использует упрощенный FSD-подход. Локальные правила описаны в
[`docs/architecture/frontend-fsd.md`](../../docs/architecture/frontend-fsd.md).

## 3. Команды запуска

Команды из корня монорепозитория:

```bash
npm run dev:frontend
```

Команды внутри `apps/frontend`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

Назначение команд:

- `npm run dev` - запуск Vite dev server;
- `npm run build` - проверка TypeScript и production-сборка;
- `npm run preview` - локальный preview production-сборки;
- `npm run lint` - проверка ESLint;
- `npm run test` - запуск тестов Vitest.

## 4. Связанные пакеты

- `@helpdesk-portal/ui-kit` - общие UI-компоненты;
- `@helpdesk-portal/eslint-config` - общие правила ESLint;
- `@helpdesk-portal/prettier-config` - общие правила форматирования;
- `@helpdesk-portal/typescript-config` - общие настройки TypeScript;
- `@helpdesk-portal/vite-config` - общие настройки Vite/Vitest.
