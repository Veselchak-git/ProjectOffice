# Архитектура проекта

Это верхнеуровневое описание архитектуры монорепозитория `helpdesk-portal`.

Документ отвечает на три вопроса:

- из каких частей состоит проект
- как эти части связаны между собой
- за что отвечает каждый пакет на верхнем уровне

## Общая схема

Проект организован как монорепозиторий и разделен на три основных типа пакетов:

- `apps/*` - конечные приложения
- `packages/*` - переиспользуемые библиотеки
- `tooling/*` - общие инструменты и конфиги разработки

Текущая логика проекта:

- `apps/frontend` - клиентское приложение
- `apps/backend` - серверное API
- `packages/ui-kit` - общая UI-библиотека для frontend
- `tooling/*` - единые правила линтинга, форматирования, TypeScript и сборки

## Структура пакетов в монорепе

```text
helpdesk-portal/
├── apps/
│   ├── backend/
│   └── frontend/
│
├── packages/
│   └── ui-kit/
│
├── tooling/
│   ├── eslint-config/
│   ├── prettier-config/
│   ├── typescript-config/
│   └── vite-config/
│
├── docs/
│   ├── architecture/
│   ├── course/
│   ├── requirements/
│   ├── version-manager/
│   └── ai/
│
├── scripts/
│   ├── sync-versions.js
│   └── collect-untracket-version.js
│
├── package.json
├── lerna.json
└── versions.jsonc
```

## Роли пакетов

### `apps/frontend`

Frontend-приложение на `React` + `Vite`.
Отвечает за пользовательский интерфейс, навигацию по страницам и взаимодействие с backend API.

### `apps/backend`

Backend-приложение на `Fastify` + `Prisma`.
Отвечает за HTTP API, бизнес-логику, доступ к данным и интеграцию с PostgreSQL.

### `packages/ui-kit`

Переиспользуемая UI-библиотека.
Нужна для того, чтобы общие компоненты, стили и токены не жили прямо внутри frontend-приложения.

### `tooling/*`

Набор общих инфраструктурных пакетов:

- `eslint-config` - единые правила линтинга
- `prettier-config` - единое форматирование
- `typescript-config` - общие tsconfig
- `vite-config` - общие настройки сборки и тестов

## Связи между частями системы

На верхнем уровне проект выглядит так:

```text
tooling/* ----------> apps/frontend
        ├-----------> apps/backend
        └-----------> packages/ui-kit

packages/ui-kit ----> apps/frontend

apps/frontend ------> apps/backend
apps/backend -------> PostgreSQL
```

Смысл связей:

- все пакеты используют общие конфиги из `tooling/*`
- frontend использует `ui-kit` как библиотеку компонентов
- frontend работает с backend через API
- backend работает с PostgreSQL через Prisma

## Управление зависимостями

В проекте используется централизованное управление версиями через `versions.jsonc`.

Это нужно для того, чтобы:

- общие зависимости были согласованы между пакетами
- версии обновлялись из одной точки
- было проще контролировать состояние монорепозитория

Связанные скрипты находятся в `scripts/`:

- `sync-versions.js`
- `collect-untracket-version.js`

Подробнее: [docs/version-manager/README.md](../version-manager/README.md)

## Связанные документы

- [docs/architecture/backend-modules.md](./backend-modules.md)
- [docs/architecture/frontend-fsd.md](./frontend-fsd.md)
- [docs/requirements/README.md](../requirements/README.md)
- [docs/version-manager/README.md](../version-manager/README.md)
- [README.md](../../README.md)
