## 06 — Инфраструктура аутентификации и guards/декораторы (ЛР7 — часть 1)

### Objective

Реализовать инфраструктурный модуль аутентификации/авторизации, интегрированный с внешним провайдером (например, SuperTokens или другим OAuth/OIDC‑провайдером), включающий:
- динамический модуль `AuthModule`, конфигурируемый через переменные окружения;
- интеграцию SDK выбранного провайдера (инициализация клиента, валидация токенов/сессий);
- `AuthGuard` (`CanActivate`), извлекающий и проверяющий пользователя из запроса;
- опциональный декоратор `@PublicAccess()` (или `@SkipAuth()`) для пропуска аутентификации;
- middleware, перенаправляющее неаутентифицированных пользователей на страницу логина/провайдера для защищённых маршрутов;
- основу для role‑based authorization (user/admin) через дополнительные guards/декораторы.

### Scope

**Включено:**
- Выбор и интеграция конкретного провайдера (SuperTokens рекомендуется, но допускается любой OAuth/OIDC‑провайдер):
  - подключение зависимостей в `backend/package.json`;
  - конфигурация через `.env` (client id/secret, redirect URI, issuer и т.п.).
- Реализация:
  - `AuthModule` как динамического модуля (`forRoot`/`forRootAsync`);
  - сервиса аутентификации (`AuthService` или обёртка над SDK);
  - `AuthGuard`, помечающего `request.user` при успешной проверке;
  - декоратора `@CurrentUser()` (опционально) для получения пользователя в контроллерах;
  - декоратора `@PublicAccess()` для публичных маршрутов;
  - декоратора/guard для ролей (`@Roles('admin')` + `RolesGuard`).

**Исключено:**
- Конкретная интеграция с REST/GraphQL/MVC эндпоинтами (это делается в задаче 07).
- UI для логина (будет описан в задаче 07).

### Dependencies

- Зависит от:
  - `[01-db-fix](./labs-04-07-01-db-fix.md)` — рабочая БД (если провайдер или хранение пользователей завязаны на БД).

### Detailed Steps

1. **Выбор провайдера и зависимости**
   - Выбрать провайдера; для SuperTokens:
     - добавить зависимости `supertokens-node` и соответствующие рецепты (например, email/password or thirdparty).
   - Для другого OIDC/OAuth:
     - использовать библиотеку, предоставляющую валидацию JWT и discovery (например, `passport` + `passport-*` стратегии, либо чистый `openid-client`).
   - Обновить `backend/package.json` и установить пакеты.

2. **Конфигурация окружения**
   - В `backend/.env` добавить переменные:
     - `AUTH_PROVIDER=supertokens` (или имя провайдера).
     - URL‑ы и ключи:
       - например, `AUTH_ISSUER_URL`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `AUTH_REDIRECT_URI`.
   - Убедиться, что `ConfigService` доступен в `AuthModule`.

3. **Модуль аутентификации**
   - Создать папку `backend/src/auth`.
   - Файл `auth.module.ts`:
     - динамический модуль (`AuthModule.forRootAsync(...)`), использующий `ConfigService`.
     - экспортирует:
       - провайдер SDK/клиента;
       - сервис аутентификации;
       - guards и декораторы (через `providers`/`exports`).
   - Файл `auth.service.ts`:
     - инкапсулирует логику:
       - инициализации SDK/клиента;
       - валидации токена/сессии по заголовку/куке;
       - извлечения информации о пользователе (id, email, roles).

4. **AuthGuard и декораторы**
   - Файл `auth.guard.ts`:
     - реализует `CanActivate`;
     - в `canActivate(context: ExecutionContext)`:
       - анализирует HTTP запрос:
         - проверяет наличие токена/куки (например, `Authorization: Bearer ...` или cookie провайдера);
         - вызывает методы `AuthService` для валидации;
       - при успехе:
         - присваивает `request.user = { id, email, roles, ... }`;
         - возвращает `true`;
       - при неуспехе:
         - либо бросает `UnauthorizedException` (для REST/GraphQL),
         - либо возвращает `false`, чтобы middleware мог перенаправить (для MVC).
   - Файл `public.decorator.ts`:
     - реализует декоратор `@PublicAccess()`:
       - по факту — устанавливает metadata (`SetMetadata('isPublic', true)`).
   - Файл `current-user.decorator.ts`:
     - для получения `request.user` в контроллерах.

5. **Роли и RolesGuard**
   - Файл `roles.decorator.ts`:
     - декоратор `@Roles('admin', 'user', ...)`, устанавливающий metadata с ролями.
   - Файл `roles.guard.ts`:
     - guard, читающий `@Roles` metadata и проверяющий `request.user.roles`.
     - при несоответствии — бросает `ForbiddenException`.

6. **Middleware для редиректа неаутентифицированных пользователей (MVC)**
   - Реализовать middleware в `auth` модуле, например, `AuthRedirectMiddleware`:
     - для определённых маршрутов (MVC‑страницы, требующие логина):
       - если `request.user` отсутствует (guard не сработал, нет сессии):
         - перенаправлять на страницу логина/провайдера (URL провайдера, либо локальный `/auth/login`).
   - Подключить middleware в `AppModule` или `AuthModule` через `configure(consumer: MiddlewareConsumer)`:
     - указать, какие пути защищены (например, `/objects/*`, `/feedback/list`, админ‑страницы).

7. **Интеграция модуля в AppModule**
   - В `backend/src/app.module.ts`:
     - импортировать `AuthModule.forRootAsync(...)`.
   - Настроить глобальное применение `AuthGuard` (опционально):
     - через `APP_GUARD` провайдер:
       - глобальный guard, проверяющий `@PublicAccess()` metadata.

### Affected Files / Modules

- Новые файлы:
  - `backend/src/auth/auth.module.ts`
  - `backend/src/auth/auth.service.ts`
  - `backend/src/auth/auth.guard.ts`
  - `backend/src/auth/public.decorator.ts`
  - `backend/src/auth/current-user.decorator.ts`
  - `backend/src/auth/roles.decorator.ts`
  - `backend/src/auth/roles.guard.ts`
  - `backend/src/auth/auth-redirect.middleware.ts`
- Изменяемые файлы:
  - `backend/src/app.module.ts` — импорт `AuthModule` и регистрация middleware/глобальных guards.
  - `backend/package.json` — зависимости провайдера аутентификации.
  - `.env` в `backend` — переменные аутентификации.

### Acceptance Criteria

- Приложение поднимается с подключенным `AuthModule` без ошибок.
- При запросе к защищённому маршруту (с учётом задачи 07):
  - `AuthGuard` умеет:
    - извлекать пользователя из запроса;
    - помещать `request.user` с полями id/email/roles.
- Декораторы:
  - `@PublicAccess()` на контроллере/методе делает маршрут публичным (не требует аутентификации).
  - `@Roles('admin')` + `RolesGuard` корректно ограничивают доступ по ролям.
- Middleware:
  - для MVC‑страниц, помеченных как защищённые, при отсутствии пользователя происходит редирект на страницу логина/провайдера.
- Базовый сценарий аутентификации с выбранным провайдером (по крайней мере, проверка полученного токена/сессии) работает и позволяет получить корректный объект пользователя.
