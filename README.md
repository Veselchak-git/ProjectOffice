# App Project Office Registry

> Учебный монорепозиторий портала техподдержки с отдельными frontend/backend приложениями, общим UI-kit и централизованным tooling.

[![Node.js](https://img.shields.io/badge/node-24.14.0-brightgreen.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-11.9.0-blue.svg)](https://www.npmjs.com/)
[![Lerna](https://img.shields.io/badge/lerna-9.0.7-purple.svg)](https://lerna.js.org/)

---

## О проекте

Репозиторий предназначен для разработки портала проектного офиса. Внутри уже выделены отдельные зоны ответственности:

- `apps/frontend` - клиентское SPA-приложение на `React` + `Vite`
- `apps/backend` - API на `Fastify` + `Prisma`
- `packages/ui-kit` - переиспользуемые UI-компоненты и токены
- `tooling/*` - единые конфиги `ESLint`, `Prettier`, `TypeScript`, `Vite`

Текущий этап проекта:

- frontend поднят как отдельное приложение с роутером и базовой инфраструктурой
- backend поднят как отдельный сервис с Prisma, PostgreSQL и JWT-аутентификацией
- ui-kit подключен как отдельный workspace-пакет
- общие настройки разработки вынесены в отдельные пакеты tooling

---

## Стек

### Core

- `TypeScript`
- `React 19`
- `React Router 7`
- `Fastify 5`
- `Prisma`
- `PostgreSQL`

### Tooling

- `Vite 8`
- `Vitest`
- `ESLint`
- `Prettier`
- `Husky`
- `lint-staged`
- `Lerna`

### Runtime

- `Node.js 24.14.0`
- `npm 11.9.0`
- `Volta` для фиксации версий среды

---

## Структура проекта

```text
app-project-office-registry/
├── apps/
│   ├── backend/                # Fastify API, Prisma schema, миграции, docker-compose
│   └── frontend/               # React SPA
│
├── packages/
│   └── ui-kit/                 # Общие UI-компоненты, стили и токены
│
├── tooling/
│   ├── eslint-config/          # Общая конфигурация ESLint
│   ├── prettier-config/        # Общая конфигурация Prettier
│   ├── typescript-config/      # Базовые tsconfig
│   └── vite-config/            # Общие настройки Vite/Vitest
│
├── docs/
│   ├── architecture/           # Архитектурные заметки
│   ├── course/                 # Материалы учебного проекта
│   ├── requirements/           # Функциональные требования
│   ├── version-manager/        # Управление версиями зависимостей
│   └── ai/                     # Вспомогательные AI-материалы
│
├── scripts/
│   ├── sync-versions.js
│   └── collect-untracket-version.js
│
└── versions.jsonc              # Источник истины для общих версий зависимостей
```

---

## Пакеты и приложения

### Apps

- [Backend](./apps/backend/README.md) - backend-пакет с Fastify, Prisma, миграциями и локальной инфраструктурой PostgreSQL
- [Frontend](./apps/frontend/README.md) - клиентское приложение на React. Сейчас содержит базовую структуру приложения, роутинг, провайдеры и интеграцию с `ui-kit`

### Packages

- `UI Kit` - библиотека общих UI-компонентов и токенов, используемая во frontend

### Tooling

- `ESLint Config` - общие правила линтинга
- `Prettier Config` - общие правила форматирования
- `TypeScript Config` - переиспользуемые tsconfig для приложений и библиотек
- `Vite Config` - общие конфиги для приложений и библиотек на Vite

---

## Быстрый старт

### Установка зависимостей

```bash
npm ci
```

### Запуск frontend

```bash
cd apps/frontend
npm run dev
```

Дополнительно:

```bash
npm run build
npm run preview
npm run lint
npm run test
```

### Запуск backend

```bash
cd apps/backend
docker compose up -d
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Дополнительно:

```bash
npm run build
npm run start
npm run lint
npm run type-check
npm run test
npm run prisma:generate
npm run prisma:studio
```

---

## Корневые команды

| Команда | Описание |
| --- | --- |
| `npm run ci` | Установить зависимости через `npm ci` |
| `npm run clean-node-modules` | Удалить все `node_modules` в репозитории |
| `npm run clean-dist` | Удалить все каталоги `dist` |
| `npm run lint-staged` | Запустить проверки для staged-файлов |
| `npm run versions:sync` | Синхронизировать версии зависимостей из `versions.jsonc` |
| `npm run versions:check` | Проверить, что версии в пакетах синхронизированы |
| `npm run versions:dry-run` | Показать изменения без записи файлов |
| `npm run versions:collect-untracket` | Собрать зависимости, которых пока нет в `versions.jsonc` |

Важно: в текущем репозитории нет корневых команд вида `npm run dev`, `npm run test` или `npm run format`. Эти команды выполняются на уровне конкретных пакетов.

---

## Управление версиями зависимостей

Проект использует централизованное хранение общих версий в `versions.jsonc`.

Основные команды:

```bash
npm run versions:sync
npm run versions:check
npm run versions:dry-run
npm run versions:collect-untracket
```

Подробнее:

 - [docs/version-manager/README.md](./docs/version-manager/README.md)

---

## Документация

- [docs/requirements/README.md](./docs/requirements/README.md) - функциональные требования к порталу
- [docs/architecture/README.md](./docs/architecture/README.md) - архитектурные заметки
- [docs/course/README.md](./docs/course/README.md) - материалы учебного проекта
- [docs/version-manager/README.md](./docs/version-manager/README.md) - управление версиями зависимостей
- [docs/ai/tooling/README.md](./docs/ai/tooling/README.md) - AI-tooling проекта

---

## Git hooks

Через `husky` и `lint-staged` в проекте настроены проверки измененных файлов перед коммитом.
