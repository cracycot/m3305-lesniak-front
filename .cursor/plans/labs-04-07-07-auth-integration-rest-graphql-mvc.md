## 07 — Интеграция аутентификации и авторизации в REST, GraphQL, MVC и Swagger (ЛР7 — часть 2)

### Objective

Интегрировать инфраструктуру аутентификации/авторизации из задачи 06 во все слои приложения:
- пометить публичные и защищённые эндпоинты (REST, GraphQL, MVC);
- применять `AuthGuard` и `RolesGuard` к нужным маршрутам;
- настроить роль‑based доступ (user/admin);
- отразить требования аутентификации в Swagger (security scheme, `@ApiBearerAuth`/аналог);
- добавить CORS‑конфигурацию в `main.ts`;
- обеспечить базовую поддержку UI логина/профиля во views или интеграцию с UI провайдера.

### Scope

**Включено:**
- REST‑уровень:
  - защита определённых `/api/...` эндпоинтов (например, изменения/удаления, список обратной связи).
  - использование `@PublicAccess()` для публичных маршрутов.
  - использование `@Roles('admin')` для админских действий.
- GraphQL‑уровень:
  - применение guards на резолверах/полях;
  - возможно — указание ролей через metadata/декораторы.
- MVC‑уровень:
  - использование middleware/guard для защиты страниц;
  - передача информации о пользователе в контекст шаблонов;
  - отображение “Войти” vs “Профиль/Выйти”.
- Swagger:
  - определение security схемы (`bearer` или `oauth2`);
  - расстановка `@ApiBearerAuth()` или `@ApiSecurity()` на защищённых контроллерах/методах.
- CORS:
  - включение и настройка CORS в `main.ts` (разрешённые origin/методы/заголовки/credentials).

**Исключено:**
- Низкоуровневая логика провайдера (уже реализована в задаче 06).

### Dependencies

- Зависит от:
  - `[02-rest-api-and-swagger](./labs-04-07-02-rest-api-and-swagger.md)` — REST‑слой готов.
  - `[03-graphql-layer](./labs-04-07-03-graphql-layer.md)` — GraphQL‑слой готов.
  - `[06-auth-infra-and-guards](./labs-04-07-06-auth-infra-and-guards.md)` — инфраструктура аутентификации реализована.

### Detailed Steps

1. **CORS в main.ts**
   - В `backend/src/main.ts`:
     - включить CORS, например:
       - `app.enableCors({ origin: [...], credentials: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', allowedHeaders: 'Content-Type, Authorization, X-Requested-With, X-Elapsed-Time' });`
     - значения `origin` можно взять из env (`FRONTEND_ORIGIN`).

2. **Интеграция AuthGuard/RolesGuard в REST**
   - В соответствующих модулях (например, `AppModule` или `AuthModule`):
     - зарегистрировать глобальный `APP_GUARD` для `AuthGuard` и `RolesGuard` (RolesGuard может быть вторым).
   - В REST‑контроллерах:
     - Пометить публичные методы `@PublicAccess()`:
       - например: `GET /api/objects`, `GET /api/objects/:id`, публичные части `/api/categories`, публичная отправка `POST /api/feedback`.
     - Для защищённых методов:
       - использовать `@Roles('admin')` для:
         - `POST /api/categories`, `PATCH/DELETE /api/categories/:id`;
         - CRUD операций над `objects`, `periods`;
         - просмотр списка обратной связи `/api/feedback` (если только для админа).
   - Проверить, что:
     - при отсутствии аутентификации на защищённом эндпоинте возвращается 401/403 (через filters).

3. **Интеграция в GraphQL**
   - В GraphQL‑резолверах:
     - использовать `@UseGuards(AuthGuard, RolesGuard)` на уровне резолвера или конкретных методов.
     - пометить публичные queries/mutations декоратором `@PublicAccess()` (через metadata).
     - для админских действий (например, удаление категорий/объектов/сообщений обратной связи) использовать `@Roles('admin')`.
   - Убедиться, что в GraphQL context:
     - `request.user` корректно прокидывается (при необходимости сконфигурировать `context: ({ req }) => ({ req })` в GraphQLModule).

4. **Интеграция в MVC views**
   - В MVC‑контроллерах (`objects`, `categories`, `feedback`):
     - вместо временной логики `buildSession(auth)`:
       - использовать `request.user`, установленный guard‑ом/ middleware;
       - передавать `user` в контекст рендера (как сейчас, но из реального пользователя).
   - Обновить middleware из задачи 06:
     - определённые пути (например, создание/редактирование объектов, просмотр списка feedback) должны требовать аутентификации:
       - если `request.user` отсутствует, редирект на страницу логина/провайдера.
   - В layout‑шаблоне:
     - отобразить:
       - если `user` есть:
         - “Здравствуйте, {{user.name}}” / “Профиль” / “Выйти”.
       - если `user` нет:
         - ссылку “Войти” (на маршрут логина/провайдера).

5. **Swagger security схема**
   - В `main.ts` при создании Swagger‑конфига:
     - в `DocumentBuilder` добавить:
       - `.addBearerAuth()` или `.addOAuth2(...)` в зависимости от реализации.
   - В REST‑контроллерах:
     - на защищённых контроллерах/методах использовать:
       - `@ApiBearerAuth()` или `@ApiSecurity('oauth2', ['...'])`.
   - Проверить, что в Swagger UI:
     - появляется кнопка “Authorize”;
     - можно задать токен (если используется bearer‑схема);
     - после авторизации защищённые эндпоинты получают `Authorization` заголовок при “Try it out”.

6. **Минимальный frontend логин/интеграция с провайдером**
   - Добавить контроллер/маршрут для логина (если нужно):
     - например, `GET /auth/login`:
       - перенаправляет на страницу логина провайдера (OAuth redirect).
     - `GET /auth/callback`:
       - обрабатывает редирект обратно от провайдера;
       - устанавливает cookie/сессию в соответствии с провайдером;
       - перенаправляет на главную/профиль.
   - В views:
     - использовать этот маршрут для ссылки “Войти”.
   - Опционально: добавить простую страницу профиля (`/profile`), показывающую данные из `request.user`.

### Affected Files / Modules

- Изменяемые файлы:
  - `backend/src/main.ts` — включение CORS, изменение Swagger‑конфига (security).
  - `backend/src/app.module.ts` или `backend/src/auth/auth.module.ts` — регистрация `APP_GUARD` для `AuthGuard` и `RolesGuard`.
  - REST‑контроллеры (`*.api.controller.ts`) — расстановка `@PublicAccess()`, `@Roles`, `@UseGuards` (если не глобально).
  - GraphQL‑резолверы — аналогичная интеграция.
  - MVC‑контроллеры (`objects.controller.ts`, `categories.controller.ts`, `feedback.controller.ts`, `app.controller.ts`) — использование `request.user` вместо `buildSession`, защита страниц.
  - Layout‑шаблон и/или header partial — отображение состояния логина.
  - Новый `auth` MVC‑контроллер (если понадобится) и маршруты `/auth/login`, `/auth/callback`, `/profile`.

### Acceptance Criteria

- CORS включён и позволяет фронтенду обращаться к backend (origin/headers/methods/credentials корректно настроены).
- Для REST‑эндпоинтов:
  - публичные (`GET /api/objects`, `GET /api/categories`, и т.п.) доступны без токена;
  - защищённые (например, изменение/удаление, список обратной связи) требуют аутентификации и соответствующей роли:
    - без токена → 401/403;
    - с токеном обычного пользователя → 403 на админских действиях;
    - с токеном admin → успешный доступ.
- Для GraphQL:
  - защищённые queries/mutations требуют авторизации и ролей аналогичным образом.
- MVC:
  - на страницах отображается корректное состояние пользователя (войти/профиль);
  - попытка зайти на защищённую страницу без авторизации приводит к редиректу на логин/провайдера.
- Swagger:
  - содержит security схему;
  - защищённые эндпоинты помечены и требуют авторизации при тестировании через “Try it out”.
