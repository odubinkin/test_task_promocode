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

## Тесты

```bash
# unit-тесты
npm run test

# e2e-тесты
npm run test:e2e

# покрытие
npm run test:cov
```
