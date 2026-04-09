import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Promocode } from '../entities/promocode.entity';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { PromocodesService } from './promocodes.service';

type MockRepository = jest.Mocked<
  Pick<
    Repository<Promocode>,
    'exists' | 'create' | 'save' | 'findOne' | 'find'
  >
>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromocodesService,
        {
          provide: getRepositoryToken(Promocode),
          useValue: {
            exists: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PromocodesService>(PromocodesService);
    repository = module.get(getRepositoryToken(Promocode));
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
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('creates and saves promocode when validation passes', async () => {
    const dto = makeDto();
    const entityToSave = makePromocode();

    repository.exists.mockResolvedValue(false);
    repository.create.mockReturnValue(entityToSave);
    repository.save.mockResolvedValue(entityToSave);

    await expect(service.create(dto)).resolves.toBe(entityToSave);
    expect(repository.create).toHaveBeenCalledWith({
      code: 'SPRING10',
      discount: 10,
      activationLimit: 5,
      validUntil: new Date('2026-12-01T12:00:00+03:00'),
    });
    expect(repository.save).toHaveBeenCalledWith(entityToSave);
  });

  it('creates and saves promocode with null activation_limit and null valid_until', async () => {
    const dto = makeDto({ activation_limit: null, valid_until: null });
    const entityToSave = makePromocode({ activationLimit: null, validUntil: null });

    repository.exists.mockResolvedValue(false);
    repository.create.mockReturnValue(entityToSave);
    repository.save.mockResolvedValue(entityToSave);

    await expect(service.create(dto)).resolves.toBe(entityToSave);
    expect(repository.create).toHaveBeenCalledWith({
      code: 'SPRING10',
      discount: 10,
      activationLimit: null,
      validUntil: null,
    });
  });

  it('throws Conflict on race condition when save fails and code appears', async () => {
    const dto = makeDto();
    const entityToSave = makePromocode();

    repository.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    repository.create.mockReturnValue(entityToSave);
    repository.save.mockRejectedValue(new Error('save failed'));

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.exists).toHaveBeenCalledTimes(2);
  });

  it('rethrows original error when save fails for non-duplicate reason', async () => {
    const dto = makeDto();
    const entityToSave = makePromocode();
    const expectedError = new Error('db unavailable');

    repository.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(false);
    repository.create.mockReturnValue(entityToSave);
    repository.save.mockRejectedValue(expectedError);

    await expect(service.create(dto)).rejects.toBe(expectedError);
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

  it('returns list of promocodes ordered by createdAt DESC', async () => {
    const entities = [makePromocode({ code: 'A' }), makePromocode({ code: 'B' })];
    repository.find.mockResolvedValue(entities);

    await expect(service.list()).resolves.toEqual(entities);
    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });
});
