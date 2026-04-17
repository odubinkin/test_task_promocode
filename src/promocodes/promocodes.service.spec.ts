import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Activation } from '../entities/activation.entity';
import { Promocode } from '../entities/promocode.entity';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import {
  GetPromocodesQueryDto,
  PROMOCODES_LIST_MAX_LIMIT,
} from './dto/get-promocodes-query.dto';
import { PromocodesService } from './promocodes.service';

type MockRepository = jest.Mocked<
  Pick<
    Repository<Promocode>,
    'exists' | 'findOne' | 'find' | 'createQueryBuilder'
  >
>;
type MockDataSource = jest.Mocked<Pick<DataSource, 'transaction'>>;
type MockEntityManager = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

type MockInsertQueryBuilder = {
  insert: jest.Mock;
  into: jest.Mock;
  values: jest.Mock;
  orIgnore: jest.Mock;
  execute: jest.Mock;
};

const makeDto = (
  overrides: Partial<CreatePromocodeDto> = {},
): CreatePromocodeDto => ({
  code: 'SPRING10',
  discount: 10,
  activation_limit: 5,
  valid_until: '2026-12-01T12:00:00+03:00',
  ...overrides,
});

const makePromocode = (overrides: Partial<Promocode> = {}): Promocode => {
  const createdAt = new Date('2026-04-09T10:00:00.000Z');

  return {
    code: 'SPRING10',
    discount: 10,
    activationLimit: 5,
    activationCount: 0,
    validUntil: new Date('2026-12-01T09:00:00.000Z'),
    createdAt,
    updatedAt: createdAt,
    activations: [],
    ...overrides,
  } as Promocode;
};

describe('PromocodesService', () => {
  let service: PromocodesService;
  let repository: MockRepository;
  let dataSource: MockDataSource;
  let transactionManager: MockEntityManager;
  let insertQueryBuilder: MockInsertQueryBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromocodesService,
        {
          provide: getRepositoryToken(Promocode),
          useValue: {
            exists: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PromocodesService>(PromocodesService);
    repository = module.get(getRepositoryToken(Promocode));
    dataSource = module.get(DataSource);
    insertQueryBuilder = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orIgnore: jest.fn(),
      execute: jest.fn(),
    };
    insertQueryBuilder.insert.mockReturnValue(insertQueryBuilder);
    insertQueryBuilder.into.mockReturnValue(insertQueryBuilder);
    insertQueryBuilder.values.mockReturnValue(insertQueryBuilder);
    insertQueryBuilder.orIgnore.mockReturnValue(insertQueryBuilder);
    repository.createQueryBuilder.mockReturnValue(
      insertQueryBuilder as unknown as ReturnType<Repository<Promocode>['createQueryBuilder']>,
    );

    transactionManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    dataSource.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args[args.length - 1] as (
        manager: EntityManager,
      ) => Promise<unknown>;

      return callback(transactionManager as unknown as EntityManager);
    });
  });

  it('throws BadRequest for invalid discount', async () => {
    await expect(service.create(makeDto({ discount: 0 }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.exists).not.toHaveBeenCalled();
  });

  it('throws BadRequest for discount greater than 100', async () => {
    await expect(
      service.create(makeDto({ discount: 101 })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.exists).not.toHaveBeenCalled();
  });

  it('throws BadRequest for negative activation_limit', async () => {
    await expect(
      service.create(makeDto({ activation_limit: -1 })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.exists).not.toHaveBeenCalled();
  });

  it('throws Conflict when promocode already exists before save', async () => {
    repository.exists.mockResolvedValue(true);

    await expect(service.create(makeDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.exists).toHaveBeenCalledWith({
      where: { code: 'SPRING10' },
    });
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('creates promocode when validation passes', async () => {
    const dto = makeDto();
    const entity = makePromocode();

    repository.exists.mockResolvedValue(false);
    insertQueryBuilder.execute.mockResolvedValue({
      identifiers: [{ code: 'SPRING10' }],
    });
    repository.findOne.mockResolvedValue(entity);

    await expect(service.create(dto)).resolves.toBe(entity);
    expect(repository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(insertQueryBuilder.values).toHaveBeenCalledWith({
      code: 'SPRING10',
      discount: 10,
      activationLimit: 5,
      validUntil: new Date('2026-12-01T12:00:00+03:00'),
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { code: 'SPRING10' },
    });
  });

  it('creates promocode with null activation_limit and null valid_until', async () => {
    const dto = makeDto({ activation_limit: null, valid_until: null });
    const entity = makePromocode({ activationLimit: null, validUntil: null });

    repository.exists.mockResolvedValue(false);
    insertQueryBuilder.execute.mockResolvedValue({
      identifiers: [{ code: 'SPRING10' }],
    });
    repository.findOne.mockResolvedValue(entity);

    await expect(service.create(dto)).resolves.toBe(entity);
    expect(insertQueryBuilder.values).toHaveBeenCalledWith({
      code: 'SPRING10',
      discount: 10,
      activationLimit: null,
      validUntil: null,
    });
  });

  it('throws Conflict when insert is ignored due to duplicate code', async () => {
    repository.exists.mockResolvedValue(false);
    insertQueryBuilder.execute.mockResolvedValue({ identifiers: [] });

    await expect(service.create(makeDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rethrows original error when insert fails for non-duplicate reason', async () => {
    const expectedError = new Error('db unavailable');

    repository.exists.mockResolvedValue(false);
    insertQueryBuilder.execute.mockRejectedValue(expectedError);

    await expect(service.create(makeDto())).rejects.toBe(expectedError);
  });

  it('returns promocode by code', async () => {
    const entity = makePromocode();
    repository.findOne.mockResolvedValue(entity);

    await expect(service.getByCode('SPRING10')).resolves.toBe(entity);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { code: 'SPRING10' },
    });
  });

  it('throws NotFound when promocode is missing', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.getByCode('MISSING')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns list of promocodes with default sorting and pagination', async () => {
    const query: GetPromocodesQueryDto = {
      limit: 20,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    const entities = [makePromocode({ code: 'A' }), makePromocode({ code: 'B' })];
    repository.find.mockResolvedValue(entities);

    await expect(service.list(query)).resolves.toEqual(entities);
    expect(repository.find).toHaveBeenCalledWith({
      take: 20,
      skip: 0,
      order: { createdAt: 'DESC' },
    });
  });

  it('returns list of promocodes with custom sorting and pagination', async () => {
    const query: GetPromocodesQueryDto = {
      limit: 5,
      offset: 10,
      sortBy: 'discount',
      sortOrder: 'asc',
    };
    const entities = [makePromocode({ code: 'C', discount: 5 })];
    repository.find.mockResolvedValue(entities);

    await expect(service.list(query)).resolves.toEqual(entities);
    expect(repository.find).toHaveBeenCalledWith({
      take: 5,
      skip: 10,
      order: { discount: 'ASC' },
    });
  });

  it('returns empty list when limit is 0', async () => {
    const query: GetPromocodesQueryDto = {
      limit: 0,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    repository.find.mockResolvedValue([]);

    await expect(service.list(query)).resolves.toEqual([]);
    expect(repository.find).toHaveBeenCalledWith({
      take: 0,
      skip: 0,
      order: { createdAt: 'DESC' },
    });
  });

  it('throws BadRequest for limit greater than max', async () => {
    const query = {
      limit: PROMOCODES_LIST_MAX_LIMIT + 1,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as GetPromocodesQueryDto;

    expect(() => service.list(query)).toThrow(BadRequestException);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('throws BadRequest for negative limit', async () => {
    const query = {
      limit: -1,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as GetPromocodesQueryDto;

    expect(() => service.list(query)).toThrow(BadRequestException);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('throws BadRequest for non-integer offset', async () => {
    const query = {
      limit: 20,
      offset: 1.5,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    } as GetPromocodesQueryDto;

    expect(() => service.list(query)).toThrow(BadRequestException);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('throws BadRequest for invalid sortBy', async () => {
    const query = {
      limit: 20,
      offset: 0,
      sortBy: 'code',
      sortOrder: 'desc',
    } as unknown as GetPromocodesQueryDto;

    expect(() => service.list(query)).toThrow(BadRequestException);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('throws BadRequest for invalid sortOrder', async () => {
    const query = {
      limit: 20,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    } as unknown as GetPromocodesQueryDto;

    expect(() => service.list(query)).toThrow(BadRequestException);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('activates promocode for normalized email and increments activation count', async () => {
    const promocode = makePromocode({ activationCount: 0, activationLimit: 2 });
    const activation = { id: '1' } as Activation;

    transactionManager.findOne
      .mockResolvedValueOnce(promocode)
      .mockResolvedValueOnce(null);
    transactionManager.create.mockReturnValue(activation);
    transactionManager.save.mockResolvedValue(activation);

    await expect(
      service.activate('SPRING10', 'User@Example.COM'),
    ).resolves.toBeUndefined();

    expect(transactionManager.findOne).toHaveBeenNthCalledWith(1, Promocode, {
      where: { code: 'SPRING10' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(transactionManager.findOne).toHaveBeenNthCalledWith(2, Activation, {
      where: { email: 'user@example.com', code: 'SPRING10' },
    });
    expect(transactionManager.create).toHaveBeenCalledWith(Activation, {
      email: 'user@example.com',
      code: 'SPRING10',
    });
    expect(transactionManager.save).toHaveBeenNthCalledWith(
      1,
      Activation,
      activation,
    );
    expect(transactionManager.save).toHaveBeenNthCalledWith(
      2,
      Promocode,
      expect.objectContaining({ code: 'SPRING10', activationCount: 1 }),
    );
  });

  it('throws Conflict when the user already activated promocode', async () => {
    transactionManager.findOne
      .mockResolvedValueOnce(makePromocode())
      .mockResolvedValueOnce({ id: '1' } as Activation);

    await expect(
      service.activate('SPRING10', 'user@example.com'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transactionManager.findOne).toHaveBeenCalledTimes(2);
    expect(transactionManager.create).not.toHaveBeenCalled();
    expect(transactionManager.save).not.toHaveBeenCalled();
  });

  it('throws BadRequest when promocode is missing during activation', async () => {
    transactionManager.findOne.mockResolvedValueOnce(null);

    await expect(
      service.activate('MISSING', 'user@example.com'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transactionManager.create).not.toHaveBeenCalled();
  });

  it('throws BadRequest when promocode activation limit is reached', async () => {
    transactionManager.findOne
      .mockResolvedValueOnce(makePromocode({ activationCount: 3, activationLimit: 3 }));

    await expect(
      service.activate('SPRING10', 'user@example.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequest when promocode is expired', async () => {
    transactionManager.findOne
      .mockResolvedValueOnce(makePromocode({ validUntil: new Date('2020-01-01T00:00:00.000Z') }));

    await expect(
      service.activate('SPRING10', 'user@example.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

});
