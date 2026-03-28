## Goal

Реализовать и довести до production-состояния backend для учебного проекта «Ленинград после Победы», последовательно:
- исправив текущую проблему с базой данных (HTTP 500 при обращении к БД),
- завершив REST API и документацию (ЛР4),
- добавив GraphQL-слой (ЛР5),
- реализовав BFF-функциональность (ЛР6),
- внедрив аутентификацию и авторизацию через внешнего провайдера (ЛР7),
с сохранением существующего MVC-интерфейса.

## Фазы и порядок работ

1. Диагностика и исправление ошибки БД (HTTP 500 / TypeORM / Postgres).
2. Построение RESTful API поверх существующей доменной модели + глобальная валидация, фильтр ошибок, пагинация, Swagger (ЛР4).
3. Добавление GraphQL (Apollo, code‑first), типы, резолверы, пагинация, ограничения сложности (ЛР5).
4. BFF‑слой: интерсептор времени, кеширование ETag + Cache‑Control + Nest CacheModule, загрузка файлов в Yandex Object Storage (ЛР6).
5. Аутентификация и авторизация через внешнего провайдера, guards, роли, интеграция во views и Swagger, CORS (ЛР7).

## Подзадачи

- [01-db-fix](./labs-04-07-01-db-fix.md) — Диагностика и исправление ошибки подключения/запросов к БД (зависит от: none).
- [02-rest-api-and-swagger](./labs-04-07-02-rest-api-and-swagger.md) — REST API для доменной модели + валидация + глобальный фильтр + пагинация + Swagger (зависит от: 01-db-fix).
- [03-graphql-layer](./labs-04-07-03-graphql-layer.md) — GraphQL‑слой (Apollo, code‑first) с пагинацией и ограничением сложности (зависит от: 01-db-fix, 02-rest-api-and-swagger).
- [04-bff-interceptor-and-caching](./labs-04-07-04-bff-interceptor-and-caching.md) — Интерсептор времени ответа и кеширование REST эндпоинтов (зависит от: 02-rest-api-and-swagger).
- [05-bff-file-upload-storage](./labs-04-07-05-bff-file-upload-storage.md) — Загрузка файлов в Yandex Object Storage и интеграция с объектами (зависит от: 01-db-fix, 02-rest-api-and-swagger).
- [06-auth-infra-and-guards](./labs-04-07-06-auth-infra-and-guards.md) — Инфраструктурный модуль аутентификации и guards/декораторы (зависит от: 01-db-fix).
- [07-auth-integration-rest-graphql-mvc](./labs-04-07-07-auth-integration-rest-graphql-mvc.md) — Интеграция авторизации в REST, GraphQL, MVC и Swagger (зависит от: 02-rest-api-and-swagger, 03-graphql-layer, 06-auth-infra-and-guards).

## Риски и допущения

- Окружение БД: предполагается, что PostgreSQL доступен локально или через `DATABASE_URL` и что схема может быть пересоздана (development‑режим, `synchronize: true` для TypeORM).
- Текущая ошибка 500 по БД может быть связана с некорректной `DATABASE_URL`, SSL‑настройками или несовпадением схемы с сущностями; подзадача 01 включает анализ логов и проверку настроек.
- Для GraphQL и BFF‑кеша предполагается, что add‑on зависимости (`@nestjs/graphql`, `@apollo/server`, `cache-manager`, `@nestjs/cache-manager` и т.п.) можно свободно добавить в `backend/package.json`.
- Для ЛР7 предполагается, что допустимо выбрать облачного провайдера аутентификации (например, SuperTokens или Auth0) и хранить конфигурацию в `.env` (не коммитить секреты в git).
- Минимальный frontend‑логин может быть реализован либо как простая форма в существующих Handlebars‑шаблонах, либо через перенаправление на UI провайдера.
