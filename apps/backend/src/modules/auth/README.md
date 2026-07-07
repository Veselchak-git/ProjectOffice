# Auth Module

Модуль `auth` отвечает за аутентификацию пользователя и доступ к защищённым маршрутам.

Входная точка модуля: [index.ts](./index.ts)

## Что делает модуль

- регистрирует `userRepository` в области модуля;
- регистрирует маршруты логина и получения текущего пользователя;
- проверяет логин и пароль;
- выдаёт JWT access token;
- использует `fastify.authenticate` для проверки токена на защищённых маршрутах.

## Маршруты

- `POST /api/auth/login`
- `GET /api/auth/me`

## Аутентификация

Аутентификация в проекте построена так:

1. Клиент отправляет `login` и `password` в `POST /api/auth/login`.
2. `auth/service.ts` ищет пользователя через `userRepository`.
3. Пароль проверяется через `verifyPassword`.
4. При успехе сервер подписывает JWT через `fastify.jwt.sign(...)`.
5. Клиент использует токен в заголовке `Authorization: Bearer <token>`.
6. Для защищённых маршрутов вызывается `fastify.authenticate`, который делает `request.jwtVerify()`.

## Авторизация

В проекте используется role-based access control через `jwtPlugin`.

Плагин добавляет два декоратора:

- `fastify.authenticate` - только проверка токена
- `fastify.authorize(...roles)` - проверка токена и роли пользователя

Логика ролей реализована в [../../plugins/jwtPlugin/index.ts](../../plugins/jwtPlugin/index.ts).

Роли описаны в Prisma enum `Role`:

- `GUEST`
- `PROJECT_MANAGER`
- `ADMIN`

В текущем модуле `auth` используется только проверка аутентификации для `GET /api/auth/me`.
Проверка ролей показана в модуле `example-module`.

## Связанные файлы

- [index.ts](./index.ts) - сборка модуля
- [controller.ts](./controller.ts) - регистрация маршрутов
- [service.ts](./service.ts) - логика логина и текущего пользователя
- [schema.ts](./schema.ts) - схемы запросов и ответов
- [../users/repository.ts](../users/repository.ts) - доступ к данным пользователя
- [../../plugins/jwtPlugin/index.ts](../../plugins/jwtPlugin/index.ts) - JWT и guard-декораторы
