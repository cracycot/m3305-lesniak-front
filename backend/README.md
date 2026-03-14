# Ленинград после Победы

**Автор:** Kirill Lesniak, группа m3305  
**Стек:** NestJS · TypeORM · PostgreSQL · Handlebars · Node.js ≥ 22

Образовательный веб-проект, посвящённый истории Ленинграда в трёх эпохах: до блокады, в период блокады и после победы. Позволяет просматривать, добавлять и редактировать исторические объекты города с разбивкой по категориям и историческим периодам.

🔗 **Деплой:** [leningrad-lesniak.onrender.com](https://leningrad-lesniak.onrender.com)

---

## Запуск локально

```bash
npm install
cp .env.example .env   # заполните DATABASE_URL
npm run start:dev      # http://localhost:3080
```

Для просмотра авторизованного состояния добавьте `?auth=1` к любому URL.

---

## Маршруты

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/` | Главная страница |
| GET | `/about` | О проекте |
| GET/POST | `/feedback` | Форма обратной связи |
| GET | `/feedback/list` | Список сообщений |
| GET | `/objects` | Список исторических объектов |
| GET | `/objects/new` | Форма создания объекта |
| GET | `/objects/:id` | Детальная страница объекта |
| GET | `/objects/:id/edit` | Форма редактирования |
| POST | `/objects` | Создать объект |
| POST | `/objects/:id` | Обновить объект |
| POST | `/objects/:id/delete` | Удалить объект |
| GET | `/objects/events` | SSE-поток новых объектов |
| GET | `/categories` | Список категорий |
| GET | `/categories/new` | Создать категорию |
| GET | `/categories/:id/edit` | Редактировать категорию |
| GET | `/periods` | Список исторических периодов |
| GET | `/periods/new` | Создать период |
| GET | `/periods/:id/edit` | Редактировать период |

---

## Доменная модель

Проект описывает предметную область **исторических объектов Ленинграда** и включает пять сущностей:

### ER-диаграмма (текстовое описание)

```
Category (1) ──────────────── (N) HistoricalObject
                                         │
                                    (1)  │  (N)
                                         ▼
                                     ObjectFact

HistoricalObject (N) ─────── (N) Period
       [через таблицу object_period]

Feedback — независимая сущность
```

### Сущности

#### `Category` — Категория объекта
| Поле | Тип | Описание |
|------|-----|----------|
| id | PK | Идентификатор |
| name | string (unique) | Название (Музей, Собор, Крепость…) |
| description | text? | Описание категории |

#### `HistoricalObject` — Исторический объект
| Поле | Тип | Описание |
|------|-----|----------|
| id | PK | Идентификатор |
| title | string | Название объекта |
| year | number | Год основания |
| imageUrl | string? | URL изображения |
| imageAlt | string? | Alt-текст |
| imageCaption | string? | Подпись к фото |
| description | text? | Историческая справка |
| category | FK → Category | Категория объекта |
| createdAt | timestamp | Дата добавления |

#### `ObjectFact` — Интересный факт об объекте
| Поле | Тип | Описание |
|------|-----|----------|
| id | PK | Идентификатор |
| text | text | Текст факта |
| object | FK → HistoricalObject | Объект (CASCADE DELETE) |

#### `Period` — Исторический период
| Поле | Тип | Описание |
|------|-----|----------|
| id | PK | Идентификатор |
| name | string | Название (До блокады, Блокада, Восстановление) |
| startYear | number? | Начальный год |
| endYear | number? | Конечный год |
| description | text? | Описание периода |

#### `Feedback` — Обратная связь
| Поле | Тип | Описание |
|------|-----|----------|
| id | PK | Идентификатор |
| name | string | Имя отправителя |
| email | string | Email |
| message | text | Текст сообщения |
| createdAt | timestamp | Дата отправки |

### Связи
- `Category` → `HistoricalObject`: один ко многим (одна категория у многих объектов)
- `HistoricalObject` → `ObjectFact`: один ко многим с каскадным удалением
- `HistoricalObject` ↔ `Period`: многие ко многим через таблицу `object_period`
- `Feedback`: независимая сущность

---

## Server-Sent Events

На странице `/objects` активно SSE-соединение с эндпоинтом `/objects/events`.  
При добавлении нового объекта все открытые вкладки получают уведомление с тостом и баннером со ссылкой на новый объект — без перезагрузки страницы.
