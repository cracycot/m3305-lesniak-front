## 02 — REST API + Validation + ExceptionFilter + Pagination + Swagger (ЛР4)

### Objective

Поверх существующей доменной модели (`Category`, `HistoricalObject`, `ObjectFact`, `Period`, `Feedback`) реализовать полноценный RESTful API:
- отдельные REST‑контроллеры под `/api/...` (без смешивания с MVC‑views);
- DTO‑классы с `class-validator`/`class-transformer` и глобальный `ValidationPipe` (уже подключён в `main.ts`);
- единый `AllExceptionsFilter` (уже реализован) для REST‑эндпоинтов;
- пагинация list‑эндпоинтов с HATEOAS‑подобным `Link`‑заголовком;
- подробная Swagger/OpenAPI‑документация (DTO, ответы, коды статуса, теги по модулям).

### Scope

**Включено:**
- Создание REST‑контроллеров:
  - `CategoriesRestController` (например, префикс `/api/categories`).
  - `ObjectsRestController` (`/api/objects`), включая связанные факты и периоды.
  - `PeriodsRestController` (`/api/periods`).
  - `FeedbackRestController` (`/api/feedback`).
- Использование уже существующих сервисов (`CategoriesService`, `ObjectsService`, `PeriodsService`, `FeedbackService`) в REST‑слое.
- DTO:
  - request DTO для create/update;
  - response DTO (опционально отдельные классы, либо использование сущностей с `@ApiProperty`).
- Пагинация:
  - query‑параметры `page`, `limit` (с дефолтами);
  - ответ — массив данных + метаданные пагинации;
  - `Link`‑заголовок с ссылками `first`, `prev`, `next`, `last` в HATEOAS‑стиле.
- Оформление Swagger:
  - `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiQuery`, `@ApiBody`, `@ApiParam` для REST‑контроллеров.
  - Добавление описаний DTO и сущностей, при необходимости — `@ApiProperty`.

**Исключено:**
- GraphQL‑резолверы.
- BFF‑интерсепторы, кэш, загрузка файлов.
- Аутентификация/авторизация (они добавятся в отдельной задаче).

### Dependencies

- Зависит от: `[01-db-fix](./labs-04-07-01-db-fix.md)` — БД должна быть исправна, CRUD‑операции работают без 500‑ошибок.

### Detailed Steps

1. **Инфраструктура для REST (если нужно разделить слои)**
   - В `backend/src` создать папку `api` (если её ещё нет) либо использовать существующие модули.
   - Определиться с именованием:
     - Например, `categories.api.controller.ts`, `objects.api.controller.ts` и т.п.
     - Можно расположить REST‑контроллеры прямо в модулях рядом с MVC‑контроллерами, но c другим префиксом и классом.

2. **REST‑контроллер для категорий**
   - Файл: `backend/src/categories/categories.api.controller.ts`.
   - Класс `CategoriesApiController` с `@Controller('api/categories')` и `@ApiTags('categories')`.
   - Методы:
     - `GET /api/categories` — список с пагинацией.
     - `GET /api/categories/:id` — получение одной категории.
     - `POST /api/categories` — создание.
     - `PATCH /api/categories/:id` (или `PUT`) — обновление.
     - `DELETE /api/categories/:id` — удаление.
   - DTO:
     - Использовать существующие `CreateCategoryDto`, `UpdateCategoryDto` (при необходимости расширить с валидацией: `@IsString()`, `@IsOptional()` и т.п.).
   - Пагинация:
     - В `CategoriesService` можно добавить метод `findAllPaginated(options)` или реализовать пагинацию на основе запроса `repo.findAndCount(...)`.
     - REST‑метод должен:
       - принимать `page`, `limit` как `@Query()` с дефолтами;
       - возвращать `{ data, total, page, limit }`;
       - выставлять заголовок `Link` вида:
         - `<${baseUrl}?page=1&limit=...>; rel="first", <...>; rel="prev", ...`.

3. **REST‑контроллер для исторических объектов**
   - Файл: `backend/src/objects/objects.api.controller.ts`.
   - Класс `ObjectsApiController` с `@Controller('api/objects')`, `@ApiTags('objects')`.
   - Методы:
     - `GET /api/objects` — список с пагинацией, включающий связанные `category`, `facts`, `periods`.
     - `GET /api/objects/:id` — детальная запись.
     - `POST /api/objects` — создание (принимает DTO с полями объекта, `categoryId`, массив строк `facts`, массив id периодов).
     - `PATCH /api/objects/:id` — частичное обновление.
     - `DELETE /api/objects/:id` — удаление.
   - DTO:
     - `CreateObjectRestDto`, `UpdateObjectRestDto` (можно переиспользовать уже имеющиеся DTO из MVC, но добавить строгую валидацию).
   - Реиспользовать `ObjectsService`:
     - при необходимости расширить сервис методами, умеющими сетать `periods` по id, чтобы REST‑слой не дублировал бизнес‑логику.
   - Пагинация аналогична пункту 2.

4. **REST‑контроллеры для периодов и обратной связи**
   - `backend/src/periods/periods.api.controller.ts`:
     - `@Controller('api/periods')`, `@ApiTags('periods')`.
     - CRUD‑методы с DTO `CreatePeriodDto` и отдельным `UpdatePeriodDto` (при необходимости добавить).
   - `backend/src/feedback/feedback.api.controller.ts`:
     - `@Controller('api/feedback')`, `@ApiTags('feedback')`.
     - `GET /api/feedback` — пагинированный список сообщений.
     - `GET /api/feedback/:id` — (опционально) получение одного сообщения.
     - `POST /api/feedback` — создание.
     - `DELETE /api/feedback/:id` — удаление.

5. **Интеграция с глобальной валидацией и фильтром**
   - Проверить, что в `main.ts` уже включён:
     - `ValidationPipe` с `transform`, `whitelist`, `forbidNonWhitelisted`.
     - `AllExceptionsFilter` (он уже регистрируется глобально).
   - Убедиться, что REST‑контроллеры используют DTO c декораторами `class-validator`, чтобы при некорректном теле запроса возвращался 400 с подробностями.

6. **Swagger/OpenAPI оформление**
   - Для каждого REST‑контроллера:
     - Добавить `@ApiTags('...')`.
     - Для методов:
       - `@ApiOperation({ summary: '...' })`.
       - `@ApiResponse({ status: 200, type: ..., isArray: ... })` и т.п.
       - `@ApiQuery({ name: 'page', required: false, ... })` и `@ApiQuery({ name: 'limit', ... })` для пагинированных эндпоинтов.
       - `@ApiBody({ type: Create...Dto })` для POST/PATCH.
   - DTO и/или сущности:
     - добавить `@ApiProperty` к полям, если нужно более детальное описание в Swagger.
   - Убедиться, что Swagger UI доступен на `/api-docs` (уже настроен в `main.ts`).

7. **Регистрация REST‑контроллеров в модулях**
   - Добавить новые REST‑контроллеры в соответствующие модули:
     - `CategoriesModule`, `ObjectsModule`, `PeriodsModule`, `FeedbackModule`.
   - Проверить, что импортируемые сервисы и сущности доступны (TypeOrmModule, экспорт сервисов и т.д.).

### Affected Files / Modules

- Новые файлы:
  - `backend/src/categories/categories.api.controller.ts`
  - `backend/src/objects/objects.api.controller.ts`
  - `backend/src/periods/periods.api.controller.ts`
  - `backend/src/feedback/feedback.api.controller.ts`
  - Возможно новые DTO: `backend/src/objects/dto/create-object-rest.dto.ts`, `backend/src/objects/dto/update-object-rest.dto.ts`, `backend/src/periods/dto/update-period.dto.ts` и т.п.
- Изменяемые файлы:
  - `backend/src/categories/categories.module.ts`
  - `backend/src/objects/objects.module.ts`
  - `backend/src/periods/periods.module.ts`
  - `backend/src/feedback/feedback.module.ts`
  - При необходимости — DTO в `backend/src/**/dto/*.dto.ts` для добавления валидации и Swagger‑метаданных.
  - `backend/src/main.ts` — при изменении Swagger‑конфигурации (опционально).

### Acceptance Criteria

- Для каждой сущности (`Category`, `HistoricalObject`, `Period`, `Feedback`) доступны REST‑эндпоинты под `/api/...`:
  - `GET /api/<entity>` — возвращает paginated JSON‑список и устанавливает заголовок `Link` с HATEOAS‑ссылками.
  - `GET /api/<entity>/:id` — возвращает один объект или 404.
  - `POST /api/<entity>` — создаёт ресурс, при некорректном теле возвращает 400 с ошибками валидации.
  - `PATCH/PUT /api/<entity>/:id` — частично обновляет ресурс.
  - `DELETE /api/<entity>/:id` — удаляет ресурс, возвращает 204 или 200 (по принятой конвенции).
- Для некорректных запросов:
  - `ValidationPipe` корректно режет лишние поля и отдаёт 400 при нарушении схемы.
  - `AllExceptionsFilter` для БД‑ошибок и других исключений отдаёт ожидаемые коды и JSON‑формат.
- Swagger UI на `/api-docs`:
  - отображает все REST‑эндпоинты с корректными тегами (`categories`, `objects`, `periods`, `feedback`);
  - показывает описания DTO и примеры запросов/ответов;
  - даёт возможность протестировать запросы (Try it out) и убедиться, что ответы соответствуют схеме.
