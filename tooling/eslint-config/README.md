# `@helpdesk-portal/eslint-config`

Общие ESLint-конфиги для монорепозитория.

## Профили

- `@helpdesk-portal/eslint-config/react-app`
  - React-приложение на Vite.
- `@helpdesk-portal/eslint-config/react-library`
  - React-библиотека компонентов без правил, завязанных на Vite HMR.
- `@helpdesk-portal/eslint-config/fastify`
  - Backend-приложение на Fastify и другой Node TypeScript runtime-код.
- `@helpdesk-portal/eslint-config/library`
  - Переиспользуемая TypeScript-библиотека без привязки к browser или node globals.

## Как использовать

### React + Vite приложение

`eslint.config.js`

```js
import reactAppConfig from "@helpdesk-portal/eslint-config/react-app";

export default reactAppConfig;
```

### React-библиотека компонентов

`eslint.config.js`

```js
import reactLibraryConfig from "@helpdesk-portal/eslint-config/react-library";

export default reactLibraryConfig;
```

### Fastify приложение

`eslint.config.js`

```js
import fastifyConfig from "@helpdesk-portal/eslint-config/fastify";

export default fastifyConfig;
```

### Общая библиотека

`eslint.config.js`

```js
import libraryConfig from "@helpdesk-portal/eslint-config/library";

export default libraryConfig;
```

## Правило

Если пакету нужен особый оverride, он добавляется локально поверх общего профиля, а не копированием всей конфигурации.
