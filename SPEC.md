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
