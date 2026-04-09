import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDatabaseExists } from '../src/database/ensure-database';

describe('PromoCode API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    await ensureDatabaseExists();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "activation", "promocode" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / returns hello world', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('creates and returns promocode by code', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'SPRING24',
        discount: 20,
        activation_limit: 2,
        valid_until: '2027-12-01T12:00:00.000Z',
      })
      .expect(201);

    expect(createResponse.body).toEqual(
      expect.objectContaining({
        code: 'SPRING24',
        discount: 20,
        activation_limit: 2,
        activation_count: 0,
        valid_until: '2027-12-01T12:00:00.000Z',
      }),
    );
    expect(typeof createResponse.body.created_at).toBe('string');
    expect(typeof createResponse.body.updated_at).toBe('string');

    const getByCodeResponse = await request(app.getHttpServer())
      .get('/api/v1/promocodes/SPRING24')
      .expect(200);

    expect(getByCodeResponse.body).toEqual(
      expect.objectContaining({
        code: 'SPRING24',
        discount: 20,
        activation_limit: 2,
        activation_count: 0,
        valid_until: '2027-12-01T12:00:00.000Z',
      }),
    );
  });

  it('returns 404 for unknown promocode code', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/promocodes/UNKNOWN')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Promocode with code "UNKNOWN" not found',
      error: 'Not Found',
    });
  });

  it('returns 409 on duplicate promocode creation', async () => {
    const payload = {
      code: 'UNIQUE10',
      discount: 10,
      activation_limit: null,
      valid_until: null,
    };

    await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send(payload)
      .expect(201);

    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send(payload)
      .expect(409);

    expect(duplicateResponse.body).toEqual({
      statusCode: 409,
      message: 'Promocode with code "UNIQUE10" already exists',
      error: 'Conflict',
    });
  });

  it('returns 400 for invalid create payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: '',
        discount: 101,
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.error).toBe('Bad Request');
  });

  it('returns 400 when create payload contains forbidden fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'FORBIDDEN1',
        discount: 10,
        activation_count: 123,
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toContain(
      'property activation_count should not exist',
    );
  });

  it('lists promocodes with sorting and pagination', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'LOW',
        discount: 5,
        activation_limit: null,
        valid_until: null,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'HIGH',
        discount: 25,
        activation_limit: null,
        valid_until: null,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/promocodes?limit=1&offset=0&sortBy=discount&sortOrder=desc')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        code: 'HIGH',
        discount: 25,
      }),
    );
  });

  it('returns 400 for invalid list query params', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/promocodes?limit=1001&sortOrder=DESC')
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'limit must not be greater than 1000',
        'sortOrder must be one of the following values: asc, desc',
      ]),
    );
  });

  it('activates promocode and blocks duplicate activation by same email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'ONCE10',
        discount: 10,
        activation_limit: 2,
        valid_until: null,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/promocodes/ONCE10/activate')
      .send({ email: 'User@Example.com' })
      .expect(204);

    const duplicateActivation = await request(app.getHttpServer())
      .post('/api/v1/promocodes/ONCE10/activate')
      .send({ email: 'user@example.com' })
      .expect(409);

    expect(duplicateActivation.body).toEqual({
      statusCode: 409,
      message:
        'Promocode with code "ONCE10" is already activated for email "user@example.com"',
      error: 'Conflict',
    });

    const activatedPromocode = await request(app.getHttpServer())
      .get('/api/v1/promocodes/ONCE10')
      .expect(200);

    expect(activatedPromocode.body).toEqual(
      expect.objectContaining({
        code: 'ONCE10',
        activation_count: 1,
      }),
    );
  });

  it('returns 400 when activation request has invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'EMAIL10',
        discount: 10,
        activation_limit: 2,
        valid_until: null,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/promocodes/EMAIL10/activate')
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toContain('email must be an email');
  });

  it('returns 400 when activating an expired promocode', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'EXPIRED1',
        discount: 10,
        activation_limit: null,
        valid_until: '2020-01-01T00:00:00.000Z',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/promocodes/EXPIRED1/activate')
      .send({ email: 'user@example.com' })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'Promocode is invalid',
      error: 'Bad Request',
    });
  });

  it('returns 400 when activation limit is reached', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/promocodes')
      .send({
        code: 'LIMIT1',
        discount: 15,
        activation_limit: 1,
        valid_until: null,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/promocodes/LIMIT1/activate')
      .send({ email: 'first@example.com' })
      .expect(204);

    const response = await request(app.getHttpServer())
      .post('/api/v1/promocodes/LIMIT1/activate')
      .send({ email: 'second@example.com' })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'Promocode is invalid',
      error: 'Bad Request',
    });
  });

  it('returns 400 when activating unknown promocode', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/promocodes/MISSING/activate')
      .send({ email: 'user@example.com' })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'Promocode is invalid',
      error: 'Bad Request',
    });
  });
});
