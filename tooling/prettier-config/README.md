# `@helpdesk-portal/prettier-config`

Единый Prettier-конфиг для всех пакетов монорепозитория.

## Как использовать

`prettier.config.js`

```js
import prettierConfig from "@helpdesk-portal/prettier-config";

export default prettierConfig;
```

Обычно одного профиля достаточно для всех приложений и библиотек.
Если для конкретного пакета понадобится исключение, лучше сначала обсудить, действительно ли это оправдано.
