## 05 — BFF: загрузка файлов в Yandex Object Storage и интеграция с доменом (ЛР6 — часть 2)

### Objective

Реализовать функциональность загрузки файлов (изображений) в объектное хранилище (Yandex Object Storage через AWS SDK) и связать их с доменной моделью (исторические объекты):
- создать инфраструктурный модуль хранения, инкапсулирующий логику работы с Yandex Object Storage;
- добавить REST‑эндпоинт(ы) для загрузки файлов (multipart/form-data);
- интегрировать загруженные файлы с полями `imageUrl`/`imageAlt`/`imageCaption` у `HistoricalObject` (или аналогичной сущности);
- обеспечить базовую валидацию файлов (тип, размер).

### Scope

**Включено:**
- Добавление зависимостей:
  - `@nestjs/platform-express` (уже есть), `multer`, `aws-sdk` или актуальный `@aws-sdk/*` для S3‑совместимого API.
- Инфраструктурный модуль, например, `StorageModule`:
  - конфигурация через переменные окружения (ключи, секрет, endpoint Yandex, bucket);
  - провайдер сервиса, умеющего:
    - принимать файл/поток;
    - загружать его в bucket;
    - возвращать публичный URL.
- REST‑эндпоинт:
  - либо отдельный `UploadController` (`/api/upload`),
  - либо расширение `ObjectsApiController` (`/api/objects/:id/image`).
- Валидация:
  - проверка MIME‑типа (например, `image/jpeg`, `image/png`);
  - проверка максимального размера;
  - обработка ошибок (через `AllExceptionsFilter`).

**Исключено:**
- UI‑часть на frontend (можно ограничиться базовой формой/полем ввода в существующих шаблонах).
- Аутентификация/авторизация (будут учитываться в задачах 06–07).

### Dependencies

- Зависит от:
  - `[01-db-fix](./labs-04-07-01-db-fix.md)` — рабочая БД.
  - `[02-rest-api-and-swagger](./labs-04-07-02-rest-api-and-swagger.md)` — REST‑слой реализован, есть объекты.

### Detailed Steps

1. **Конфигурация окружения для Yandex Object Storage**
   - В `backend/.env` (не коммитить секреты) добавить:
     - `YANDEX_S3_ENDPOINT=storage.yandexcloud.net` или конкретный endpoint.
     - `YANDEX_S3_REGION=ru-central1`.
     - `YANDEX_S3_BUCKET=...`
     - `YANDEX_S3_ACCESS_KEY_ID=...`
     - `YANDEX_S3_SECRET_ACCESS_KEY=...`
   - Убедиться, что `ConfigModule` глобален (уже так в `AppModule`).

2. **Инфраструктурный модуль хранения**
   - Создать папку `backend/src/storage`.
   - Файл `storage.module.ts`:
     - динамический модуль с использованием `ConfigService`;
     - предоставляет сервис `StorageService`.
   - Файл `storage.service.ts`:
     - инициализирует AWS S3‑клиент с использованием env (endpoint, креды, bucket);
     - метод `uploadObject(file: Express.Multer.File, options?): Promise<string>`:
       - загружает файл в bucket (ключ можно генерировать по UUID и оригинальному расширению);
       - возвращает публичный URL или путь.

3. **Интеграция Nest multipart‑загрузки**
   - В подходящем REST‑контроллере (например, `ObjectsApiController`):
     - добавить эндпоинт:
       - `POST /api/objects/:id/image` с `@UseInterceptors(FileInterceptor('file'))`;
       - `@ApiConsumes('multipart/form-data')` + DTO для Swagger.
     - метод:
       - принимает `@Param('id')`, `@UploadedFile()` и (опционально) доп. поля `imageAlt`, `imageCaption`.
       - вызывает `StorageService.uploadObject(file, ...)`.
       - обновляет `HistoricalObject`:
         - устанавливает `imageUrl` в полученный URL;
         - опционально `imageAlt`, `imageCaption`.
   - Валидация файлов:
     - использовать `fileFilter` и/или `limits` в `FileInterceptor`:
       - разрешить только `image/*`;
       - ограничить размер (например, до 5MB).
     - при нарушении условий — выбрасывать `BadRequestException` (обработается фильтром).

4. **Swagger документация для загрузки файлов**
   - Для эндпоинта загрузки:
     - `@ApiOperation({ summary: 'Загрузка изображения объекта' })`.
     - `@ApiConsumes('multipart/form-data')`.
     - `@ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, imageAlt: { type: 'string' }, imageCaption: { type: 'string' } } } })`.
     - `@ApiResponse({ status: 200, description: 'URL загруженного изображения', schema: { ... } })`.

5. **Простая интеграция с MVC (опционально)**
   - В существующих шаблонах объектов:
     - убедиться, что `imageUrl` используется для отображения картинки;
     - при наличии — добавить простую форму/ссылку для загрузки изображения (можно использовать обычный HTML `<form enctype="multipart/form-data">` на эндпоинт `/api/objects/:id/image`).

### Affected Files / Modules

- Новые файлы:
  - `backend/src/storage/storage.module.ts`
  - `backend/src/storage/storage.service.ts`
- Изменяемые файлы:
  - `backend/src/app.module.ts` — импорт `StorageModule`.
  - Один из REST‑контроллеров (скорее всего `objects.api.controller.ts`) — добавление эндпоинта загрузки.
  - DTO для Swagger‑описания multipart (можно сделать отдельный DTO).
  - MVC‑шаблоны объектов (`backend/views/objects/*.hbs`) — использование `imageUrl` (опционально).

### Acceptance Criteria

- В Swagger `/api-docs` виден эндпоинт загрузки файла (например, `POST /api/objects/{id}/image`) с типом `multipart/form-data`.
- Через Swagger или любой HTTP‑клиент можно:
  - отправить запрос с файлом (`file`), `imageAlt`, `imageCaption`;
  - получить успешный ответ с URL загруженного файла;
  - убедиться, что соответствующий `HistoricalObject` обновил `imageUrl` (и alt/caption при передаче).
- Файлы реально появляются в Yandex Object Storage в указанном bucket (можно проверить через веб‑консоль/CLI).
- При попытке загрузить слишком большой или не‑image файл:
  - сервер возвращает 400 Bad Request с осмысленным сообщением (через `AllExceptionsFilter`).
