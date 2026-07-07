# `@helpdesk-portal/typescript-config`

Общие TypeScript-конфиги для монорепозитория.

## Что есть

- `@helpdesk-portal/typescript-config/base`
  - Общая строгая база для всех подпроектов.
- `@helpdesk-portal/typescript-config/react-app`
  - Для React-приложений на Vite.
- `@helpdesk-portal/typescript-config/vite-node`
  - Для `vite.config.ts`, `vitest.config.ts` и других Node-файлов рядом с Vite.
- `@helpdesk-portal/typescript-config/fastify`
  - Для backend-приложений на Fastify с обычной компиляцией в `dist`.
- `@helpdesk-portal/typescript-config/library`
  - Для библиотек компонентов и переиспользуемого TypeScript-кода.

## Как использовать

Если зависимости установлены и workspace-пакет подлинкован, используйте `extends` через имя пакета.

### React + Vite приложение

`tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`

```json
{
  "extends": "@helpdesk-portal/typescript-config/react-app",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
  },
  "include": ["src"]
}
```

`tsconfig.node.json`

```json
{
  "extends": "@helpdesk-portal/typescript-config/vite-node",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo"
  },
  "include": ["vite.config.ts"]
}
```

### Fastify приложение

`tsconfig.json`

```json
{
  "extends": "@helpdesk-portal/typescript-config/fastify",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.server.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

### Библиотека

`tsconfig.json`

```json
{
  "extends": "@helpdesk-portal/typescript-config/library",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.lib.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.test.tsx"]
}
```

## Правило

В общих конфигах лежат только стабильные настройки по типу проекта.
Все настройки, которые зависят от конкретного пакета, переопределяются локально:

- `include`
- `exclude`
- `tsBuildInfoFile`
- при необходимости `rootDir`, `outDir`, `types`
