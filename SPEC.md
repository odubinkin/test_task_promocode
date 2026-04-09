# Спецификация БД PromoCode

## Обзор
Схема состоит из двух таблиц:
- `promocode`: основная таблица с правилами промокода и служебными полями жизненного цикла.
- `activation`: факты активации промокодов по email.

Поле `activation.promocode_code` ссылается на `promocode.code`.

## Таблица `promocode`
Назначение: хранение параметров промокода и текущей статистики использования.

Поля:
- `code varchar(15)`
  - Первичный ключ.
  - Строковый идентификатор промокода.
- `discount smallint not null`
  - Значение скидки в процентах.
  - Допустимый диапазон: от `1` до `100`.
- `activation_limit integer null`
  - Необязательный лимит количества активаций.
  - Если `null`, лимит не ограничен.
  - Если задан, должен быть `>= 0`.
- `activation_count integer not null default 0`
  - Текущее количество успешных активаций.
  - Должно быть `>= 0`.
- `valid_until timestamptz null`
  - Необязательная дата/время окончания действия промокода.
- `created_at timestamptz not null default now()`
  - Дата/время создания записи.
- `updated_at timestamptz not null default now()`
  - Дата/время последнего обновления записи.

Ограничения `CHECK`:
- `promocode_discount_check`
  - `discount between 1 and 100`
- `promocode_activation_limit_check`
  - `activation_limit is null or activation_limit >= 0`
- `promocode_activation_count_check`
  - `activation_count >= 0`
- `promocode_activation_consistency_check`
  - `activation_limit is null or activation_count <= activation_limit`

Индексы:
- `promocode_created_at_idx` (`created_at`)
  - Нужен для сортировки списка промокодов по `createdAt`.
- `promocode_updated_at_idx` (`updated_at`)
  - Нужен для сортировки по `updatedAt` в `GET /api/v1/promocodes`.
- `promocode_valid_until_idx` (`valid_until`)
  - Нужен для сортировки по `validUntil`.
- `promocode_discount_idx` (`discount`)
  - Нужен для сортировки по `discount`.
- `promocode_activation_limit_idx` (`activation_limit`)
  - Нужен для сортировки по `activationLimit`.

## Таблица `activation`
Назначение: хранение факта использования промокода конкретным email.

Поля:
- `id bigserial`
  - Первичный ключ.
- `email varchar(255) not null`
  - Email пользователя.
- `promocode_code varchar(15) not null`
  - Внешний ключ на `promocode(code)`.
- `created_at timestamptz not null default now()`
  - Дата/время активации.

Ограничения:
- `activation_promocode_fk`
  - Внешний ключ (`promocode_code`) -> `promocode(code)`.
  - Поведение при удалении: `on delete restrict`.
- `activation_email_promocode_unique`
  - Уникальная пара (`promocode_code`, `email`).
  - Один и тот же email не может повторно активировать один и тот же промокод.

## Отображение в TypeORM
Структура файлов:
- `src/entities/promocode.entity.ts`
- `src/entities/activation.entity.ts`
- `src/database/typeorm.config.ts`
- `src/database/data-source.ts`

Конфигурация БД:
- Используется только PostgreSQL.
- Параметры подключения задаются через переменные окружения.

Основные переменные окружения:
- `DB_HOST` (по умолчанию `localhost`)
- `DB_PORT` (по умолчанию `5432`)
- `DB_USERNAME` (по умолчанию `postgres`)
- `DB_PASSWORD` (по умолчанию `postgres`)
- `DB_NAME` (по умолчанию `promocode`)
- `DB_SSL` = `true` | `false` (по умолчанию `false`)
- `TYPEORM_SYNCHRONIZE` = `true` | `false` (по умолчанию `false`)
- `TYPEORM_LOGGING` = `true` | `false` (по умолчанию `false`)

## API v1: промокоды

Базовый префикс:
- `/api/v1/promocodes`

Формат времени:
- API принимает любые валидные строки ISO 8601 для входящих timestamp-полей.
- API всегда возвращает timestamp-поля в UTC в формате ISO 8601 (например, `2026-04-09T05:24:31.000Z`).

### POST `/api/v1/promocodes`
Назначение: создать новый промокод.

Тело запроса (`application/json`):
- `code string` — обязательно, длина от `1` до `15` символов.
- `discount number` — обязательно, целое число от `1` до `100`.
- `activation_limit number | null` — необязательно, если задано, целое число `>= 0`.
  - `null` означает, что лимита активаций нет.
  - `0` валиден и означает, что промокод сразу недоступен для активации.
- `valid_until string | null` — необязательно.
  - `null` означает бессрочное действие промокода.
  - если задано значение, это валидный ISO 8601 timestamp.

Поля, которые нельзя передавать при создании:
- `activation_count`
- `created_at`
- `updated_at`

Ответ:
- `201 Created` и объект промокода со всеми полями:
  - `code`
  - `discount`
  - `activation_limit`
  - `activation_count`
  - `valid_until`
  - `created_at`
  - `updated_at`
- `400 Bad Request` при нарушении валидации.
- `409 Conflict` если промокод с таким `code` уже существует.

### GET `/api/v1/promocodes/{code}`
Назначение: получить промокод по его коду.

Параметры пути:
- `code string` — длина от `1` до `15` символов.

Ответ:
- `200 OK` и объект промокода со всеми полями:
  - `code`
  - `discount`
  - `activation_limit`
  - `activation_count`
  - `valid_until`
  - `created_at`
  - `updated_at`
- `404 Not Found` если запись не найдена.

### GET `/api/v1/promocodes`
Назначение: получить список промокодов.

Параметры запроса:
- `limit number` — необязательно, по умолчанию `20`, целое число в диапазоне `0..1000` (верхняя граница задана PROMOCODES_LIST_MAX_LIMIT).
- `offset number` — необязательно, по умолчанию `0`, целое число `>= 0`.
- `sortBy string` — необязательно, по умолчанию `createdAt`.
  - Доступные поля:
  - `createdAt`
  - `updatedAt`
  - `validUntil`
  - `discount`
  - `activationLimit`
- `sortOrder string` — необязательно, по умолчанию `desc`.
  - Допустимые значения: `asc`, `desc`.

Ответ:
- `200 OK` и массив объектов промокодов.
- Каждый объект содержит все поля:
  - `code`
  - `discount`
  - `activation_limit`
  - `activation_count`
  - `valid_until`
  - `created_at`
  - `updated_at`

### POST `/api/v1/promocodes/{code}/activate`
Назначение: активировать промокод для email.

Параметры пути:
- `code string` — длина от `1` до `15` символов.

Тело запроса (`application/json`):
- `email string` — обязательно, валидный email.
  - перед активацией нормализуется в lowercase.

Логика:
- Проверяется, что такой email еще не активировал данный промокод.
  - Поиск выполняется по паре (`promocode_code`, `email`) в этом порядке, чтобы использовать индекс/уникальное ограничение `activation_email_promocode_unique`.
- Проверяется валидность промокода:
  - `(activation_limit is null) or (activation_limit > activation_count)`
  - `(valid_until is null) or (valid_until > now())`
- В рамках одной транзакции:
  - создается запись в `activation`;
  - у `promocode` увеличивается `activation_count` на `1`.

Ответ:
- `204 No Content` при успешной активации.
- `400 Bad Request` для невалидного промокода или некорректных входных параметров.
- `409 Conflict` если этот email уже активировал данный промокод.
