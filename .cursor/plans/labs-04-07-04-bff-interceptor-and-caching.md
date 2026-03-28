## 04 — BFF: интерсептор времени ответа и кеширование REST эндпоинтов (ЛР6 — часть 1)

### Objective

Реализовать BFF‑функциональность:
- **кастомный интерсептор**, измеряющий серверное время обработки запроса и:
  - добавляющий его в контекст шаблонов MVC;
  - выставляющий заголовок `X-Elapsed-Time` для REST и GraphQL;
- **кеширование одного REST‑ресурса** с помощью:
  - заголовков `ETag` и `Cache-Control` на клиентской стороне;
  - `CacheModule` NestJS (in-memory, TTL) на серверной стороне.

### Scope

**Включено:**
- Интерсептор (например, `RequestTimingInterceptor`) с логикой:
  - замер времени до/после `next.handle()`;
  - для REST/GraphQL — установка `X-Elapsed-Time` в ответ;
  - для MVC — добавление значения в локалы ответа/модель (чтобы отобразить в шаблонах).
- Подключение интерсептора глобально:
  - через `app.useGlobalInterceptors(...)` в `main.ts` или через модуль.
- Кэширование:
  - выбор одного сущностного ресурса (например, список исторических объектов `/api/objects` или `/api/categories`);
  - использование `@nestjs/cache-manager`:
    - настройка `CacheModule.register({ ttl: ... })` в `AppModule` или отдельном модуле;
    - в REST‑контроллере — использование кэша:
      - проверка наличия записи по ключу (например, `objects:list:page:limit`);
      - при наличии — возврат кэшированного результата;
      - при отсутствии — чтение из БД, сохранение в кэш, возврат.
  - Использование HTTP‑заголовков `ETag` и `Cache-Control`:
    - генерация ETag (например, хеш по JSON‑данным/`updatedAt`/`total` и т.п.);
    - обработка заголовка `If-None-Match`:
      - при совпадении с текущим ETag — вернуть `304 Not Modified` без тела;
      - при несовпадении — вернуть свежий ответ с новым ETag.

**Исключено:**
- Загрузка файлов и интеграция с объектным хранилищем (отдельная задача 05).
- Аутентификация/авторизация (отдельные задачи 06–07).

### Dependencies

- Зависит от:
  - `[02-rest-api-and-swagger](./labs-04-07-02-rest-api-and-swagger.md)` — REST‑эндпоинты уже существуют и стабильно работают.

### Detailed Steps

1. **Интерсептор измерения времени**
   - Создать файл `backend/src/common/interceptors/request-timing.interceptor.ts`.
   - Реализовать `RequestTimingInterceptor`:
     - реализует `NestInterceptor`;
     - в `intercept(context, next)`:
       - зафиксировать `const start = performance.now()` (или `Date.now()`).
       - вызвать `next.handle().pipe(tap(...))`.
       - после завершения запроса:
         - вычислить `elapsedMs`.
         - через `context.switchToHttp().getResponse<Response>()`:
           - выставить заголовок `X-Elapsed-Time: ${elapsedMs.toFixed(0)}ms` для REST/GraphQL.
         - для MVC:
           - если ответ рендерит шаблон, добавить `res.locals.elapsedTime = elapsedMs` или аналог, чтобы передать в Handlebars.
   - Подключить интерсептор глобально в `main.ts`:
     - `app.useGlobalInterceptors(new RequestTimingInterceptor());`.

2. **Отображение времени в MVC‑шаблонах**
   - В layout‑шаблоне (например, `backend/views/partials` или основном layout) добавить вывод:
     - например, в футере: “Серверное время ответа: {{elapsedTime}} мс”, если значение присутствует.
   - Убедиться, что контроллеры, использующие `@Render`, автоматически получают `elapsedTime`:
     - либо через `res.locals`, либо через расширенный объект рендера (можно обернуть рендер в интерсепторе).

3. **Подключение CacheModule**
   - В `backend/src/app.module.ts` или отдельном модуле (например, `backend/src/cache/cache.module.ts`):
     - импортировать `CacheModule` из `@nestjs/cache-manager`;
     - зарегистрировать его, например:
       - `CacheModule.register({ ttl: 60_000, max: 100 })` (ttl в мс или сек в зависимости от версии).
   - Убедиться, что модуль доступен тем контроллерам/сервисам, где будет кэш.

4. **Кеширование REST‑ресурса на сервере**
   - Выбрать ресурс, подходящий для демонстрации (например, `GET /api/objects` или `GET /api/categories`).
   - В соответствующем REST‑контроллере (из задачи 02):
     - внедрить `@Inject(CACHE_MANAGER) private cache: Cache`.
     - в методе списка:
       - сформировать ключ (например, `objects:list:${page}:${limit}`).
       - попытаться прочитать кэш: `const cached = await this.cache.get(key)`.
       - если есть — вернуть кэшированный результат (и всё равно выставить `X-Elapsed-Time`, который теперь будет низким).
       - если нет — получить данные из сервиса/БД, положить в кэш, вернуть.

5. **ETag + Cache-Control для клиента**
   - В том же REST‑методе списка:
     - сгенерировать ETag, например:
       - `const etag = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');`
       - или на основе `total` и максимальной `updatedAt` (если есть).
     - прочитать `If-None-Match` из request:
       - `const ifNoneMatch = req.headers['if-none-match'];`
     - если `ifNoneMatch === etag`:
       - вернуть `304 Not Modified` и **не** отправлять тело.
     - иначе:
       - установить заголовки:
         - `ETag: <etag>`
         - `Cache-Control: public, max-age=30` (или другой разумный TTL).
       - вернуть обычный JSON‑ответ.
   - Это можно сделать прямо в контроллере, имея доступ к `@Req() req` и `@Res({ passthrough: true }) res`.

6. **Swagger описание кэша (опционально)**
   - В Swagger для данного эндпоинта описать наличие заголовков:
     - `@ApiHeader` / `@ApiResponse({ headers: { 'ETag': {...}, 'Cache-Control': {...} } })` при необходимости.

### Affected Files / Modules

- Новые файлы:
  - `backend/src/common/interceptors/request-timing.interceptor.ts`
- Изменяемые файлы:
  - `backend/src/main.ts` — регистрация глобального интерсептора.
  - Layout и/или partial шаблоны (`backend/views/**/*.hbs`) — вывод `elapsedTime`.
  - `backend/src/app.module.ts` (или отдельный модуль) — `CacheModule`.
  - Один из REST‑контроллеров из задачи 02 (`*.api.controller.ts`) — добавление кэша и ETag‑логики.

### Acceptance Criteria

- Любой HTTP‑запрос (MVC, REST, GraphQL):
  - в ответе содержит заголовок `X-Elapsed-Time` с временем обработки запроса (в мс).
- Для MVC‑страниц (например, `/objects`, `/categories`, `/feedback`):
  - на странице отображается серверное время ответа (значение, переданное из интерсептора).
- Для выбранного REST‑эндпоинта (например, `GET /api/objects`):
  - первый запрос читает данные из БД (видно по логам), выставляет `ETag` и `Cache-Control`.
  - повторный запрос с тем же содержимым:
    - при наличии `If-None-Match` с актуальным ETag:
      - возвращает `304 Not Modified` без тела.
    - при запросе без If-None-Match, но в пределах TTL:
      - данные берутся из server‑side кэша (можно проверить по логам/времени ответа).
- Производительность эндпоинта заметно улучшена на повторных запросах (меньше обращений к БД, меньше `X-Elapsed-Time`).
