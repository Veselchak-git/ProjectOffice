# AI Tooling

Централизованная директория для инструментов AI-ассистентов (Cursor, Codex, Claude Code, Cline, KiloCode, OpenCode).

## Структура

```text
docs/ai/tooling/
├── agents/                        # Subagents — роли с узкой специализацией
│   └── docs-researcher.md
├── skills/                        # Agent Skills — многошаговые workflow
│   ├── documentation-lookup/
│   │   └── SKILL.md
│   └── interview/
│       └── SKILL.md
├── commands/                      # Custom Commands/Workflows — быстрые промпты
│   └── docs.md
├── mcp.json                       # Конфигурация MCP-серверов
└── README.md
```

## Назначение

Централизованное хранение AI-инструментов во избежание дублирования между разными ассистентами.

### Проблема

Разные AI-инструменты используют разные директории:

| Инструмент      | Skills              | Commands/Workflows    | Subagents           | MCP                      | Memory                 |
| --------------- | ------------------- | --------------------- | ------------------- | ------------------------ | ---------------------- |
| **Cursor**      | `.cursor/skills/`   | `.cursor/commands/`   | `.cursor/agents/`   | `.cursor/mcp.json`       | через `AGENTS.md`      |
| **Junie**       | `.junie/skills/`    | —                     | —                   | `.ai/mcp/mcp.json`       | `.junie/guidelines.md` |
| **Claude Code** | `.claude/skills/`   | —                     | —                   | —                        | через `CLAUDE.md`      |
| **Codex**       | `.codex/skills/`    | —                     | `.codex/agents/`    | `.codex/config.toml`     | через `AGENTS.md`      |
| **KiloCode**    | `.kilo/skills/`     | `.kilo/workflows/`    | `.kilo/agents/`     | `.kilo/mcp.json`         | через `AGENTS.md`      |
| **OpenCode**    | `.opencode/skills/` | `.opencode/commands/` | `.opencode/agents/` | `opencode.jsonc` в корне | через `AGENTS.md`      |

### Решение

Хранить общие инструменты в `docs/ai/tooling/` и создавать симлинки в специфичные директории.

Команды ниже выполняются из **корня репозитория** (рядом с `AGENTS.md`).

**Важно:** в первом аргументе `ln -s` указывается цель **как её разрешает система относительно каталога, в котором лежит симлинк**, а не относительно текущей директории. Поэтому для файлов в `.cursor/` путь к `docs/` начинается с `../`.

```bash
# Cursor — skills
ln -s ../docs/ai/tooling/skills .cursor/skills
# Cursor — mcp
ln -s ../docs/ai/tooling/mcp.json .cursor/mcp.json
# Cursor — agents
ln -s ../docs/ai/tooling/agents .cursor/agents
# Cursor — commands
ln -s ../docs/ai/tooling/commands .cursor/commands

# KiloCode — workflows (команды):
ln -s ../docs/ai/tooling/commands .kilo/workflows
# KiloCode — skills:
ln -s ../docs/ai/tooling/skills .kilo/skills
# KiloCode — agents:
ln -s ../docs/ai/tooling/agents .kilo/agents
# KiloCode — mcp:
ln -s ../docs/ai/tooling/mcp.json .kilo/mcp.json

# Opencode skills:
ln -s ../docs/ai/tooling/skills .opencode/skills
# Opencode commands:
ln -s ../docs/ai/tooling/commands .opencode/commands
# Opencode agents:
ln -s ../docs/ai/tooling/agents .opencode/agents

# Junie guidelines:
ln -s ../AGENTS.md .junie/guidelines.md
# Junie skills:
ln -s ../docs/ai/tooling/skills .junie/skills
# Junie mcp: TODO doesn't work yet
ln -s ../../docs/ai/tooling/mcp.json .ai/mcp/mcp.json

# Gemini/Antigravity skills:
ln -s ../docs/ai/tooling/skills .agent/skills

# Codex skills:
ln -s ../docs/ai/tooling/skills .codex/skills
# Codex agents:
# Codex использует TOML-файлы, поэтому Markdown agents из docs/ai/tooling/agents
# нужно переносить в .codex/agents/*.toml вручную.

# Claude skills:
ln -s ../docs/ai/tooling/skills .claude/skills
# Claude mcp:
ln -s ../docs/ai/tooling/mcp.json .claude/.mcp.json
```

## Типы инструментов

### Skills

Открытый стандарт. Подробности: [agentskills.io](https://agentskills.io).

- Многошаговые workflow с логикой
- Файлы `SKILL.md` с детальными инструкциями
- Используются агентом автоматически или при явном упоминании
- Рядом со `SKILL.md` можно хранить инструкции, примеры кода, шаблоны

### Commands / Workflows

- Быстрые текстовые промпты и шаблоны для частых операций
- В Cursor вызываются через слеш в чате или через cmd+K
- В KiloCode называются Workflows (`.kilocode/workflows/`)
- Формат: фронтматтер `description` + `argument-hint`, затем тело промпта

### Agents (Subagents)

- Отдельные роли для узкоспециализированных задач
- Описываются в `.md`-файлах с фронтматтером (`name`, `description`, `model`)
- Используются для делегирования и не занимают контекст основного потока
- Можно указать, какие модели будут использоваться (зависит от инструмента)
- В Codex custom agents описываются отдельными `.toml`-файлами в `.codex/agents/` или `~/.codex/agents/`; обязательные поля: `name`, `description`, `developer_instructions`

### MCP

Открытый стандарт: [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/getting-started/intro)

- Расширяет функционал AI для работы со специфичными источниками данных и инструментами
- При грамотном использовании экономит токены
- Все подключённые MCP попадают в системный промпт — отключайте неиспользуемые в настройках IDE
- Разные инструменты требуют разной настройки мцп (где то разные типы нужны, где то файл, в котором указывается мцп отличный от указанного)

**Подключённые MCP (`mcp.json`):**

| MCP        | Пакет                   | Назначение                                           |
| ---------- | ----------------------- | ---------------------------------------------------- |
| `context7` | `@upstash/context7-mcp` | Актуальная документация по библиотекам и фреймворкам |

## Настройка Cursor

- `AGENTS.md` в корне автоматически читается Cursor
- Опция **Include third-party skills, subagents, and other configs** подтягивает инструменты из `.claude`, `.codex` и других директорий — **рекомендуется отключить**, чтобы не увеличивать расход токенов
- В версии 2.5 появился маркетплейс плагинов (объединяют skills, MCP, subagents) — набор для `context7` взят оттуда

При установке плагинов из маркетплейса:

1. Делайте пометки в этом файле
2. Проверяйте настройки Cursor — каждый skill, MCP и subagent попадает в системный промпт

## Доступные инструменты

### Skills

| Название               | Описание                                                |
| ---------------------- | ------------------------------------------------------- |
| `documentation-lookup` | Поиск актуальной документации и примеров по библиотекам |
| `interview`            | Интервьюирование по плану реализации задачи             |
| `state-manager`        | Правила работы с Redux, TabManager и tab-local state    |
| `ui-kit-components`    | Правила создания компонентов для ui-kit/components      |

### Commands

| Название | Вызов                              | Описание                                           |
| -------- | ---------------------------------- | -------------------------------------------------- |
| `docs`   | `/context7:docs <library> [query]` | Получить документацию по библиотеке через Context7 |

### Agents

| Название          | Модель       | Описание                                                              |
| ----------------- | ------------ | --------------------------------------------------------------------- |
| `docs-researcher` | sonnet       | Исследование документации библиотек через Context7                    |
| `docs-researcher` | gpt-5.4-mini | Codex-сабагент для исследования документации библиотек через Context7 |

---

> При добавлении новых skills/commands/agents обновляйте таблицы выше.
