## 03 — GraphQL слой (Apollo, code-first) с пагинацией и ограничением сложности (ЛР5)

### Objective

Добавить GraphQL‑слой поверх существующей доменной модели, используя NestJS + Apollo (code‑first):
- настроить `GraphQLModule` с `ApolloDriver` и схемой, генерируемой из TypeScript классов;
- определить `@ObjectType` и `@InputType` для `Category`, `HistoricalObject`, `ObjectFact`, `Period`, `Feedback` и обёрток пагинации;
- реализовать резолверы для запросов (queries) и мутаций (mutations), согласованные с REST‑API и доменной логикой;
- реализовать nested field‑резолверы (например, для получения `category`/`facts`/`periods` у объекта);
- добавить пагинацию (аргументы `page`, `limit` + тип результата) и ограничение сложности запросов;
- включить GraphQL Playground/Explorer на `/graphql`.

### Scope

**Включено:**
- Установка и настройка зависимостей:
  - `@nestjs/graphql`, `@apollo/server`, `graphql`, `graphql-tools` (точный список в зависимости от версии Nest 10).
- Конфигурация `GraphQLModule.forRoot`/`forRootAsync` в `AppModule` или отдельном модуле.
- Создание:
  - GraphQL типов (`@ObjectType`, `@Field`) для доменных сущностей.
  - Input типов (`@InputType`) для create/update мутаций.
  - Резолверов:
    - `CategoryResolver`
    - `ObjectResolver`
    - `PeriodResolver`
    - `FeedbackResolver`
  - Пагинированных типов (`PaginatedCategory`, `PaginatedObject`, и т.п.).
- Настройка ограничения сложности (например, `graphql-query-complexity` или встроенные лимиты по глубине/количеству).

**Исключено:**
- Любые REST‑изменения (уже сделаны в задаче 02).
- BFF‑кэширование и интерсепторы.
- Аутентификация/авторизация (добавятся в задачах 06–07).

### Dependencies

- Зависит от:
  - `[01-db-fix](./labs-04-07-01-db-fix.md)` — рабочая БД.
  - `[02-rest-api-and-swagger](./labs-04-07-02-rest-api-and-swagger.md)` — доменная бизнес‑логика и DTO уже отработаны.

### Detailed Steps

1. **Установка GraphQL зависимостей**
   - В `backend/package.json` добавить зависимости (или установить через npm/yarn):
     - `@nestjs/graphql`
     - `@apollo/server`
     - `graphql`
     - при необходимости: `graphql-tools`, `graphql-query-complexity`.

2. **Настройка GraphQLModule**
   - Создать файл `backend/src/graphql/graphql.module.ts` (опционально) или добавить конфигурацию прямо в `AppModule`.
   - Пример конфигурации:
     - использовать `ApolloDriver`, `ApolloDriverConfig`;
     - `autoSchemaFile: join(process.cwd(), 'backend/src/schema.gql')` или путь в `dist`;
     - включить `playground: true` или аналогичный GraphQL explorer.
   - Убедиться, что endpoint `/graphql` настроен (по умолчанию).

3. **GraphQL типы для доменных сущностей**
   - Создать, например, `backend/src/graphql/types`:
     - `category.type.ts` с `@ObjectType()` и `@Field()` для полей `Category`:
       - id, name, description, список объектов (опционально, через отдельный field‑resolver).
     - `historical-object.type.ts` для `HistoricalObject`:
       - поля: id, title, year, imageUrl, imageAlt, imageCaption, description, createdAt;
       - связи: `category`, `facts`, `periods`.
     - `object-fact.type.ts` для `ObjectFact`.
     - `period.type.ts` для `Period`.
     - `feedback.type.ts` для `Feedback`.
   - Продумать, какие связи делать `nullable`, чтобы не ломать схему.

4. **Input типы (create/update)**
   - Создать `backend/src/graphql/inputs`:
     - `create-category.input.ts`, `update-category.input.ts`.
     - `create-object.input.ts`, `update-object.input.ts`:
       - поля, аналогичные REST DTO: `title`, `year`, `categoryId`, массив строк `facts`, массив id `periodIds`.
     - `create-period.input.ts`, `update-period.input.ts`.
     - `create-feedback.input.ts` (обратная связь).
   - Добавить декораторы `@InputType()` и `@Field()` для всех полей.

5. **Пагинированные типы**
   - Реализовать generic helper или явные типы:
     - `PaginatedCategory`, `PaginatedObject`, `PaginatedPeriod`, `PaginatedFeedback`.
   - Структура:
     - `items: T[]`
     - `total: number`
     - `page: number`
     - `limit: number`

6. **Резолверы**
   - В `backend/src/graphql/resolvers` создать резолверы, использующие существующие сервисы:
     - `categories.resolver.ts`
       - `@Query(() => PaginatedCategory)` `categories(page, limit)`
       - `@Query(() => Category, { nullable: true })` `category(id)`
       - `@Mutation(() => Category)` `createCategory(input)`
       - `@Mutation(() => Category)` `updateCategory(id, input)`
       - `@Mutation(() => Boolean)` `removeCategory(id)`
     - `objects.resolver.ts`
       - Аналогично, но с более сложным DTO (`facts`, `periodIds`).
       - Поля: `@ResolveField()` для `category`, `facts`, `periods`, если не загружать eagerly.
     - `periods.resolver.ts`
       - CRUD + пагинация.
     - `feedback.resolver.ts`
       - Запрос списка и создание сообщения.
   - Внутри резолверов использовать логику из сервисов (не дублировать SQL/ORM).

7. **Ограничение сложности запросов**
   - В конфигурации `GraphQLModule`:
     - подключить middleware/плагин `graphql-query-complexity` или аналог;
     - задать максимальную сложность/глубину (например, глубина 5, max complexity ~100).
   - При превышении лимита — возвращать понятную ошибку.

8. **Интеграция с фильтром ошибок и логированием**
   - Убедиться, что ошибки из резолверов/сервисов логируются глобальным фильтром или GraphQL‑механизмом:
     - для 500/503 БД‑ошибок — соответствующие сообщения.

### Affected Files / Modules

- Новые файлы:
  - `backend/src/graphql/graphql.module.ts` (если выносится отдельно).
  - `backend/src/graphql/types/*.ts`
  - `backend/src/graphql/inputs/*.ts`
  - `backend/src/graphql/resolvers/*.ts`
  - Файл схемы (например, `backend/src/schema.gql` или в `dist`).
- Изменяемые файлы:
  - `backend/src/app.module.ts` — импорт `GraphQLModule`/`GraphqlModule`.
  - `backend/package.json` — зависимости.

### Acceptance Criteria

- Приложение поднимается без ошибок и предоставляет GraphQL endpoint `/graphql`.
- В GraphQL Playground/Explorer:
  - можно выполнить запросы:
    - `categories(page, limit) { items { id name } total page limit }`
    - `objects(page, limit) { items { id title year category { id name } } }`
    - `periods(...)`, `feedback(...)` и т.п.
  - можно выполнять мутации:
    - создание/обновление/удаление категорий, объектов, периодов, сообщений обратной связи;
    - данные реально меняются в БД и видны как через GraphQL, так и через REST/MVC.
- Пагинация в GraphQL:
  - возвращает корректные поля `items`, `total`, `page`, `limit`.
- Ограничение сложности запросов:
  - слишком “тяжёлые” запросы (большая глубина/ширина) отклоняются с понятной ошибкой;
  - обычные запросы работают корректно и быстро.
