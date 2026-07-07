# Управление версиями зависимостей

Этот монорепозиторий использует централизованное управление версиями зависимостей через файл `versions.jsonc`.

## Зачем это нужно

- Единая точка управления версиями для общих библиотек
- Согласованность зависимостей между `apps/*`, `packages/*` и `tooling/*`
- Быстрое обновление общих версий без ручного редактирования каждого `package.json`
- Удобная проверка синхронизации в CI

## Где хранится источник истины

Источник истины для общих версий находится в корневом файле `versions.jsonc`.

Структура файла сейчас такая:

```jsonc
{
  "$schema": "./docs/version-manager/versions.schema.json",
  "dependencies": {
    "react": "19.2.4",
    "typescript": "6.0.2",
    "vite": "8.0.4",
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
  },
}
```

Важно:

- В `versions.jsonc` нет отдельной секции `devDependencies`
- Общие версии для `dependencies` и `devDependencies` пакетов берутся из секции `dependencies`
- Секция `peerDependencies` используется только для синхронизации `peerDependencies`

## Как использовать

### 1. Добавить или обновить общую версию

Откройте `versions.jsonc` и измените нужную библиотеку:

```jsonc
{
  "dependencies": {
    "react": "19.2.4",
    "typescript": "6.0.2",
    "новая-библиотека": "1.0.0",
  },
  "peerDependencies": {
    "react": "^19.0.0",
  },
}
```

### 2. Посмотреть изменения без записи

```bash
npm run versions:dry-run
```

Команда покажет, какие `package.json` будут обновлены, но не сохранит изменения.

### 3. Применить синхронизацию

```bash
npm run versions:sync
```

После этого скрипт обновит подходящие зависимости в workspace-пакетах и в корневом `package.json`.

### 4. Обновить lock-файл

```bash
npm install
```

## Доступные команды

### `npm run versions:sync`

Применяет синхронизацию версий в `package.json`.

### `npm run versions:check`

Проверяет, есть ли расхождения между `versions.jsonc` и `package.json`.
Если различия найдены, команда завершается с кодом `1`.

### `npm run versions:dry-run`

Показывает, какие изменения были бы внесены, без записи файлов.

## Как это работает

Скрипт `scripts/sync-versions.js`:

1. Читает корневой `versions.jsonc`
2. Находит все `package.json` в `packages/*`, `apps/*`, `tooling/*`
3. Обновляет:
   - `dependencies` из `versions.dependencies`
   - `devDependencies` из `versions.dependencies`
   - `peerDependencies` из `versions.peerDependencies`
4. Отдельно синхронизирует `root package.json`, но только его `devDependencies`
5. В режиме `--check` не пишет файлы и возвращает ошибку, если найдены расхождения

## Что скрипт обновляет, а что нет

- Обновляются только уже существующие зависимости в `package.json`
- Скрипт не добавляет новые пакеты автоматически в `dependencies`, `devDependencies` или `peerDependencies`
- В workspace-пакетах пропускаются зависимости со значением `"*"` в `dependencies` и `devDependencies`
- Это сделано для внутренних пакетов монорепозитория, у которых версия может оставаться `"*"`

## Пример рабочего процесса

1. Нужно обновить `react` и `react-dom`
2. Меняете версии в `versions.jsonc`
3. Запускаете `npm run versions:dry-run`
4. Если список изменений корректный, запускаете `npm run versions:sync`
5. Затем выполняете `npm install`

## FAQ

**Q: Можно ли хранить общие dev-зависимости в `versions.jsonc`?**

A: Да, но их нужно добавлять в секцию `dependencies`. Текущий скрипт использует именно её как источник для синхронизации и `dependencies`, и `devDependencies`.

**Q: Что если у одного пакета должна быть отдельная версия зависимости?**

A: Можно указать её вручную в конкретном `package.json`, но `versions:sync` снова приведет её к значению из `versions.jsonc`, если эта библиотека там присутствует.

**Q: Скрипт добавляет новые зависимости в пакеты автоматически?**

A: Нет. Он синхронизирует только те зависимости, которые уже есть в конкретном `package.json`.

**Q: Как синхронизируются `peerDependencies`?**

A: `peerDependencies` берутся только из секции `peerDependencies` файла `versions.jsonc`.

**Q: Что будет с зависимостью, если ее нет в `versions.jsonc`?**

A: Ничего, скрипт это проигнорирует.
