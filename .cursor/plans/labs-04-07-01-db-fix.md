## 01 — Диагностика и исправление ошибки БД (HTTP 500)

### Objective

Найти и исправить причину HTTP 500 при запросах к БД (TypeORM + Postgres), обеспечив:
- успешное подключение к базе данных при старте Nest‑приложения;
- корректную работу базовых CRUD‑операций для `Category`, `HistoricalObject`, `Period`, `Feedback` без 500‑ошибок;
- понятные сообщения об ошибках и коды ответов через глобальный `AllExceptionsFilter`.

### Scope

**Включено:**
- Проверка конфигурации `TypeOrmModule` в `DatabaseModule` и переменных окружения (`DATABASE_URL`, `DATABASE_SSL_DISABLE`, `NODE_ENV`).
- Проверка и/или создание схемы БД, соответствующей сущностям:
  - `Category`, `HistoricalObject`, `ObjectFact`, `Period`, `Feedback`, а также join‑таблицы `object_period`.
- Диагностика типичных проблем:
  - неверный URL БД или креды;
  - SSL‑ошибки при подключении к облачной БД;
  - отсутствие таблиц / миграций, несовпадение типов, foreign key ошибки.
- Настройка логирования ошибок БД (TypeORM logging при dev, просмотр логов Nest).

**Исключено:**
- Любые GraphQL‑изменения.
- Реализация REST API, кэша, загрузки файлов, аутентификации (они идут отдельными задачами и просто зависят от исправной БД).

### Dependencies

- Нет зависимостей от других подзадач.
- Требуется доступ к запущенной PostgreSQL и возможность задать `DATABASE_URL` (например, через `.env`).

### Detailed Steps

1. **Проверка и настройка переменных окружения**
   - Открыть `backend/src/database/database.module.ts` и убедиться, какие env‑переменные используются:
     - `DATABASE_URL`, `DATABASE_SSL_DISABLE`, `NODE_ENV`.
   - Добавить (или проверить наличие) файла `.env` в папке `backend` с параметрами:
     - `DATABASE_URL=postgres://user:password@localhost:5432/leningrad`
       - Локально: убедиться, что такие креды реально существуют в Postgres.
       - Для облачной БД: учитывать `sslmode=require` или `ssl=true` в URL.
     - При необходимости — `DATABASE_SSL_DISABLE=1` для локальной БД без SSL.
   - Убедиться, что `ConfigModule.forRoot({ isGlobal: true })` действительно подхватывает env (уже сделано в `AppModule`).

2. **Проверка и отладка подключения TypeORM**
   - Включить логирование TypeORM:
     - В фабрике `useFactory` в `DatabaseModule` временно добавить `logging: true` и, при необходимости, `logger: 'advanced-console'`.
   - Запустить backend (через `npm run start:dev` в `backend`) и следить за логами:
     - Убедиться, что нет ошибок подключения (ECONNREFUSED, SSL, wrong password).
     - При ошибках авторизации/хоста:
       - скорректировать `DATABASE_URL` под реально доступную БД.
     - При SSL‑ошибках:
       - если локально — убедиться, что `DATABASE_SSL_DISABLE=1` или `sslmode=disable` в URL;
       - если в production/облаке — оставить `ssl` включённым, возможно с `rejectUnauthorized: false` (уже предусмотрено).

3. **Согласование схемы БД с сущностями**
   - Проверить текущие таблицы (через psql / GUI) и сравнить с сущностями:
     - `Category`, `HistoricalObject`, `ObjectFact`, `Period`, `Feedback`, join‑таблица `object_period`.
   - Так как в dev‑режиме включён `synchronize: !isProduction`, можно:
     - либо позволить TypeORM автоматически создать/обновить таблицы;
     - либо, если схема сломана, **удалить** и пересоздать БД `leningrad` (только для development!).
   - Проверить, что нет коллизий по unique/index (например, `Category.name` c `unique: true`).

4. **Проверка базовых операций и 500‑ошибок**
   - Создать несколько записей для:
     - `Category` (через существующий MVC UI `/categories`).
     - `HistoricalObject` (через `/objects` — создание и просмотр списка).
     - `Feedback` (`/feedback` форма + `/feedback/list`).
   - Наблюдать:
     - При любых 500‑ошибках посмотреть логи Nest (консоль) и перехват в `AllExceptionsFilter`:
       - `QueryFailedError` → проверить `pg`‑код (`23505`, `23503` и т.д.).
   - Исправить:
     - неправильные foreign‑key связи (например, если join‑таблица `object_period` или FK `ObjectFact.objectId` не совпадают с ожиданиями);
     - несоответствие типов полей (например, `startYear`/`endYear` типы в БД против `number` в TS);
     - отсутствующие таблицы.

5. **Чистка временного логирования (опционально)**
   - После того как соединение стабильно и CRUD операции выполняются без 500, можно:
     - выключить подробное `logging` или оставить только минимально нужный уровень (по решению ревьюера/преподавателя).

### Affected Files / Modules

- `backend/src/database/database.module.ts` — настройки `TypeOrmModule.forRootAsync`.
- `.env` в `backend` (или другая конфигурация окружения, не коммитить секреты).
- Схема PostgreSQL (таблицы для `Category`, `HistoricalObject`, `ObjectFact`, `Period`, `Feedback`, join‑таблица `object_period`).
- Косвенно: все сервисы, использующие `@InjectRepository(...)` (`CategoriesService`, `ObjectsService`, `PeriodsService`, `FeedbackService`).

### Acceptance Criteria

- Backend (`npm run start:dev` в `backend`) успешно поднимается без ошибок подключения к БД.
- При использовании существующего MVC UI:
  - Переход на `/categories`, `/objects`, `/periods?` (если есть MVC‑страницы), `/feedback`, `/feedback/list` **не** приводит к HTTP 500.
  - Создание/редактирование/удаление сущностей выполняется успешно, записи видны в базе.
- При симуляции ошибок БД (например, временное отключение Postgres):
  - Глобальный `AllExceptionsFilter` возвращает осмысленные коды:
    - 503 Service Unavailable / “Database unavailable” для ошибок соединения.
    - 409 Conflict / “Duplicate entry” для уникальных конфликтов.
    - 400 Bad Request / “Foreign key constraint violation” для FK‑ошибок.
- Логи Nest содержат понятные сообщения об ошибках БД, достаточные для отладки.
