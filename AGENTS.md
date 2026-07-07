## General

Always answer in Russian.

## Project Overview

This is a **Lerna-based monorepo** using `npm workspaces` with centralized tooling and version management. The repository contains shared configuration packages, reusable libraries, and React applications.

## Architecture

- **[ARCHITECTURE](docs/architecture/README.md)** - monorepo structure
- **[BACKEND_MODULES](docs/architecture/backend-modules.md)** - backend module conventions
- **[FRONTEND_FSD](docs/architecture/frontend-fsd.md)** - frontend structure and simplified FSD conventions

## Rule Priority

- If instructions conflict, apply this priority order:
  - `AGENTS.md`
  - relevant documents in `docs/architecture/*`
  - local conventions of the specific package or application
  - the current implementation in code
- If the current implementation conflicts with documentation, explicitly mention it in the report.
- If the conflict affects an architectural decision or may break a contract, stop and ask the user for clarification.

## External Libraries

- When working with external libraries, frameworks, or third-party APIs, use the available project documentation tooling before relying on memory.
- Prefer the `documentation-lookup` skill for library documentation, API references, setup/configuration questions, and code examples.
- Use the `docs-researcher` subagent when documentation lookup is a focused side task that can run independently from the main implementation context.
- Treat Context7 as the primary documentation source behind these tools when library behavior, API shape, configuration, or version-specific details matter.
- Use project code and existing local patterns first, then verify uncertain or version-sensitive details through `documentation-lookup`, `docs-researcher`, or direct Context7 MCP access when needed.
- If Context7 or the available documentation tooling does not provide enough information, explicitly state that and fall back to the next best authoritative source.
- For changes involving new or unfamiliar libraries, verify the intended usage before implementation.

## Execution Policy

- Start every new task with a short execution plan. Use plan mode when it is available and appropriate.
- Follow this order: inspect context -> plan -> ask questions if needed -> implement -> validate -> report.
- Keep changes scoped to the request. Do not perform incidental refactoring unless it is required to solve the task.

## Validation

- After code changes, run relevant checks only for the affected packages and applications.
- During implementation, start with targeted checks and run only the tests affected by the current changes.
- At the end of the task, run the full set of checks for the affected block.
- An affected block means the specific application, package, or module that was changed, not the entire monorepo.
- Preferred validation order: `lint`, `typecheck`, targeted tests during implementation, the full test suite of the affected block at the end, then `build` if it is relevant for this kind of change.
- If validation was not run, explicitly state why.

## Monorepo Change Rules

- Do not modify shared tooling, workspace configuration, or `versions.jsonc` unless the task explicitly requires it.
- Prefer local changes in the affected package or application over global changes.
- If a global change is necessary, explain why in the final report.

## Tests

- Never delete existing tests unless explicitly requested.
- If behavior changes, add new tests or update existing tests to cover the new behavior.
- If tests cannot reasonably be added, explain the gap and the residual risk.

## Specs

- Save planning/spec artifacts in `docs/ai/spec`.
- Use separate files with meaningful names in the format `YYYY-MM-DD-short-task-name.md`.
- All specifications must be written in Russian.
- Each specification must contain:
  - Context
  - Problem
  - Proposed solution
  - Risks
  - Open questions
  - Validation plan

## Documentation

- Update relevant documentation when public behavior, architectural assumptions, or developer workflow changes.

## Clarifications

- Ask the user for clarification before proceeding if:
  - the target package or application is unclear;
  - there are multiple equally valid architectural directions;
  - the change may break a public contract or shared API.

## Final Response Format

- The final response must include:
  - what was changed;
  - what was validated;
  - what was not validated;
  - known risks or possible follow-up tasks.
