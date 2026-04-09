# PromoCode API

`PromoCode API` — это тестовое задание на `NestJS + TypeORM + PostgreSQL`.

Сервис реализует управление промокодами и их активацией:
- создание промокода;
- получение промокода по коду;
- получение списка промокодов с пагинацией и сортировкой;
- активация промокода для email.

Ключевая бизнес-логика активации:
- один и тот же email не может активировать один и тот же промокод повторно;
- промокод активируется только если не истёк `valid_until`;
- промокод активируется только если не превышен `activation_limit` (или лимит не задан);
- при успешной активации создаётся запись в `activation` и увеличивается `activation_count`.

## Техническое описание

Подробная спецификация БД и API находится в файле [SPEC.md](./SPEC.md).

## Запуск проекта

### 1) Установка зависимостей

```bash
npm install
```

### 2) Настройка БД

Проект использует PostgreSQL. Параметры подключения задаются через переменные окружения:
- `DB_HOST` (по умолчанию `localhost`)
- `DB_PORT` (по умолчанию `5432`)
- `DB_USERNAME` (по умолчанию `postgres`)
- `DB_PASSWORD` (по умолчанию `postgres`)
- `DB_NAME` (по умолчанию `promocode`)
- `DB_SSL` (`true` / `false`, по умолчанию `false`)
- `DB_AUTO_CREATE` (`true` / `false`, по умолчанию `false`) — автоматически создать `DB_NAME`, если базы нет
- `DB_BOOTSTRAP_DATABASE` (по умолчанию `postgres`) — служебная БД для подключения перед созданием `DB_NAME`
- `TYPEORM_SYNCHRONIZE` (`true` / `false`, по умолчанию `false`)
- `TYPEORM_LOGGING` (`true` / `false`, по умолчанию `false`)

### 3) Запуск

```bash
# режим разработки
npm run start:dev

# production-сборка и запуск
npm run build
npm run start:prod
```

## OpenAPI / Swagger

После запуска сервиса документация доступна по адресу:
- `http://localhost:3000/api/docs` — Swagger UI
- `http://localhost:3000/api/docs-json` — OpenAPI JSON

Спецификация включает:
- схемы запросов/ответов для всех endpoints;
- ограничения полей (валидация, enum, диапазоны);
- примеры данных;
- типовые ошибки (`400`, `404`, `409`).

## Тесты

```bash
# unit-тесты
npm run test

# e2e-тесты (используется .env.test)
npm run test:e2e

# покрытие
npm run test:cov
```

### Конфигурация e2e

`npm run test:e2e` всегда загружает переменные окружения из файла `.env.test`.

Перед первым запуском создайте локальный `.env.test`:

```bash
cp .env.example .env.test
```

Рекомендуется использовать отдельную тестовую БД, например:
- `DB_NAME=promocode_test`
- `DB_AUTO_CREATE=true`
- `TYPEORM_SYNCHRONIZE=true`
