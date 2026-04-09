import { Test, TestingModule } from '@nestjs/testing';
import { Promocode } from '../entities/promocode.entity';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { GetPromocodeParamsDto } from './dto/get-promocode-params.dto';
import { GetPromocodesQueryDto } from './dto/get-promocodes-query.dto';
import { PromocodesController } from './promocodes.controller';
import { PromocodesService } from './promocodes.service';

const makePromocode = (overrides: Partial<Promocode> = {}): Promocode => {
  const now = new Date('2026-04-09T10:00:00.000Z');

  return {
    code: 'SPRING10',
    discount: 10,
    activationLimit: null,
    activationCount: 0,
    validUntil: null,
    createdAt: now,
    updatedAt: now,
    activations: [],
    ...overrides,
  } as Promocode;
};

describe('PromocodesController', () => {
  let controller: PromocodesController;
  let service: jest.Mocked<PromocodesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromocodesController],
      providers: [
        {
          provide: PromocodesService,
          useValue: {
            create: jest.fn(),
            getByCode: jest.fn(),
            list: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PromocodesController>(PromocodesController);
    service = module.get(PromocodesService);
  });

  it('creates a promocode and returns API response shape', async () => {
    const dto: CreatePromocodeDto = {
      code: 'SPRING10',
      discount: 10,
      activation_limit: 100,
      valid_until: '2026-12-01T12:00:00+03:00',
    };
    const entity = makePromocode({
      activationLimit: 100,
      validUntil: new Date('2026-12-01T09:00:00.000Z'),
    });

    service.create.mockResolvedValue(entity);

    await expect(controller.create(dto)).resolves.toEqual({
      code: 'SPRING10',
      discount: 10,
      activation_limit: 100,
      activation_count: 0,
      valid_until: '2026-12-01T09:00:00.000Z',
      created_at: '2026-04-09T10:00:00.000Z',
      updated_at: '2026-04-09T10:00:00.000Z',
    });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('returns promocode by code', async () => {
    const params: GetPromocodeParamsDto = { code: 'SPRING10' };
    const entity = makePromocode();

    service.getByCode.mockResolvedValue(entity);

    await expect(controller.getByCode(params)).resolves.toEqual({
      code: 'SPRING10',
      discount: 10,
      activation_limit: null,
      activation_count: 0,
      valid_until: null,
      created_at: '2026-04-09T10:00:00.000Z',
      updated_at: '2026-04-09T10:00:00.000Z',
    });
    expect(service.getByCode).toHaveBeenCalledWith('SPRING10');
  });

  it('returns list of promocodes', async () => {
    const query: GetPromocodesQueryDto = {
      limit: 20,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    const first = makePromocode({ code: 'FIRST' });
    const second = makePromocode({ code: 'SECOND', discount: 20 });

    service.list.mockResolvedValue([first, second]);

    await expect(controller.list(query)).resolves.toEqual([
      {
        code: 'FIRST',
        discount: 10,
        activation_limit: null,
        activation_count: 0,
        valid_until: null,
        created_at: '2026-04-09T10:00:00.000Z',
        updated_at: '2026-04-09T10:00:00.000Z',
      },
      {
        code: 'SECOND',
        discount: 20,
        activation_limit: null,
        activation_count: 0,
        valid_until: null,
        created_at: '2026-04-09T10:00:00.000Z',
        updated_at: '2026-04-09T10:00:00.000Z',
      },
    ]);
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledWith(query);
  });
});
