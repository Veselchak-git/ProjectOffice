# `@helpdesk-portal/vite-config`

Общие Vite-конфиги для монорепозитория.

## Профили

- `@helpdesk-portal/vite-config/react-app`
  - Базовый Vite-конфиг для React-приложений.
- `@helpdesk-portal/vite-config/react-library`
  - Базовый Vite-конфиг для React UI-библиотек в library mode.

## Как использовать

### React app

`vite.config.ts`

```ts
import reactAppConfig from "@helpdesk-portal/vite-config/react-app";

export default reactAppConfig;
```

Если пакету нужны локальные overrides, расширяйте общий конфиг через `mergeConfig`.

```ts
import reactAppConfig from "@helpdesk-portal/vite-config/react-app";
import { defineConfig, mergeConfig } from "vite";

export default mergeConfig(
  reactAppConfig,
  defineConfig({
    server: {
      port: 3000,
    },
  }),
);
```

### React library

`vite.config.ts`

```ts
import reactLibraryConfig from "@helpdesk-portal/vite-config/react-library";
import { defineConfig, mergeConfig } from "vite";
import { resolve } from "node:path";

export default mergeConfig(
  reactLibraryConfig,
  defineConfig({
    build: {
      lib: {
        entry: resolve(import.meta.dirname, "src/index.ts"),
        name: "UiKit",
        fileName: "index",
        formats: ["es"],
      },
    },
  }),
);
```

## Правило

Shared config задаёт только стабильный baseline.
Всё, что зависит от конкретного пакета, описывается локально:

- `build.lib.entry`
- `build.lib.name`
- `build.lib.fileName`
- форматы вывода
- локальные aliases и dev-server overrides

## Не использовать для Fastify

Fastify-приложения не должны использовать Vite как стандартный runtime/build tool.
Для backend в монорепозитории используется отдельный подход на `tsx + tsc`.
