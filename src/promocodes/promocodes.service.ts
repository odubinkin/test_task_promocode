import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsOrderValue,
  Repository,
} from 'typeorm';
import { Activation } from '../entities/activation.entity';
import { Promocode } from '../entities/promocode.entity';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import {
  GetPromocodesQueryDto,
  PROMOCODES_LIST_MAX_LIMIT,
  PromocodeSortBy,
  SORT_BY_FIELDS,
  SORT_ORDERS,
} from './dto/get-promocodes-query.dto';

const PROMOCODE_ALREADY_EXISTS_ERROR =
  'Promocode with code "%s" already exists';
const DISCOUNT_RANGE_ERROR = 'discount must be between 1 and 100';
const ACTIVATION_LIMIT_RANGE_ERROR =
  'activation_limit must be null or greater than or equal to 0';
const PROMOCODE_NOT_FOUND_ERROR = 'Promocode with code "%s" not found';
const INVALID_LIMIT_ERROR = `limit must be an integer between 0 and ${PROMOCODES_LIST_MAX_LIMIT}`;
const INVALID_OFFSET_ERROR = 'offset must be an integer greater than or equal to 0';
const INVALID_SORT_BY_ERROR = `sortBy must be one of: ${SORT_BY_FIELDS.join(', ')}`;
const INVALID_SORT_ORDER_ERROR = `sortOrder must be one of: ${SORT_ORDERS.join(', ')}`;
const INVALID_PROMOCODE_ERROR = 'Promocode is invalid';
const PROMOCODE_ALREADY_ACTIVATED_ERROR =
  'Promocode with code "%s" is already activated for email "%s"';

@Injectable()
/**
 * Handles persistence and retrieval logic for promocodes.
 */
export class PromocodesService {
  constructor(
    @InjectRepository(Promocode)
    private readonly promocodeRepository: Repository<Promocode>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a promocode record with validated input data.
   * Throws conflict if a promocode with the same code already exists.
   */
  async create(dto: CreatePromocodeDto): Promise<Promocode> {
    if (dto.discount < 1 || dto.discount > 100) {
      throw new BadRequestException(DISCOUNT_RANGE_ERROR);
    }

    if (dto.activation_limit !== null && dto.activation_limit < 0) {
      throw new BadRequestException(ACTIVATION_LIMIT_RANGE_ERROR);
    }

    const existingPromocode = await this.promocodeRepository.exists({
      where: { code: dto.code },
    });

    if (existingPromocode) {
      throw new ConflictException(
        PROMOCODE_ALREADY_EXISTS_ERROR.replace('%s', dto.code),
      );
    }

    const promocode = this.promocodeRepository.create({
      code: dto.code,
      discount: dto.discount,
      activationLimit: dto.activation_limit ?? null,
      validUntil: dto.valid_until ? new Date(dto.valid_until) : null,
    });

    try {
      return await this.promocodeRepository.save(promocode);
    } catch (error) {
      const duplicateAfterSaveError = await this.promocodeRepository.exists({
        where: { code: dto.code },
      });

      if (duplicateAfterSaveError) {
        throw new ConflictException(
          PROMOCODE_ALREADY_EXISTS_ERROR.replace('%s', dto.code),
        );
      }

      throw error;
    }
  }

  /**
   * Returns a promocode by its code.
   * Throws not found when no record matches the provided code.
   */
  async getByCode(code: string): Promise<Promocode> {
    const promocode = await this.promocodeRepository.findOne({
      where: { code },
    });

    if (!promocode) {
      throw new NotFoundException(
        PROMOCODE_NOT_FOUND_ERROR.replace('%s', code),
      );
    }

    return promocode;
  }

  /**
   * Returns promocodes with pagination and configurable sorting.
   */
  list(query: GetPromocodesQueryDto): Promise<Promocode[]> {
    if (
      !Number.isInteger(query.limit) ||
      query.limit < 0 ||
      query.limit > PROMOCODES_LIST_MAX_LIMIT
    ) {
      throw new BadRequestException(INVALID_LIMIT_ERROR);
    }

    if (!Number.isInteger(query.offset) || query.offset < 0) {
      throw new BadRequestException(INVALID_OFFSET_ERROR);
    }

    if (!SORT_BY_FIELDS.includes(query.sortBy)) {
      throw new BadRequestException(INVALID_SORT_BY_ERROR);
    }

    if (!SORT_ORDERS.includes(query.sortOrder)) {
      throw new BadRequestException(INVALID_SORT_ORDER_ERROR);
    }

    const sortOrder: FindOptionsOrderValue =
      query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const order = { [query.sortBy]: sortOrder } as Record<
      PromocodeSortBy,
      FindOptionsOrderValue
    >;

    return this.promocodeRepository.find({
      take: query.limit,
      skip: query.offset,
      order,
    });
  }

  /**
   * Activates promocode for a specific email.
   */
  async activate(code: string, email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    await this.dataSource.transaction(async (manager) => {
      const promocode = await manager.findOne(Promocode, {
        where: { code },
        lock: { mode: 'pessimistic_write' },
      });

      if (!promocode || !this.isPromocodeValid(promocode)) {
        throw new BadRequestException(INVALID_PROMOCODE_ERROR);
      }

      await this.ensureEmailNotActivated(manager, normalizedEmail, code);

      const activation = manager.create(Activation, {
        email: normalizedEmail,
        code,
      });

      await manager.save(Activation, activation);

      promocode.activationCount += 1;
      await manager.save(Promocode, promocode);
    });
  }

  private async ensureEmailNotActivated(
    manager: EntityManager,
    email: string,
    code: string,
  ): Promise<void> {
    const existingActivation = await manager.findOne(Activation, {
      where: {
        code,
        email,
      },
    });

    if (existingActivation) {
      throw new ConflictException(
        PROMOCODE_ALREADY_ACTIVATED_ERROR
          .replace('%s', code)
          .replace('%s', email),
      );
    }
  }

  private isPromocodeValid(promocode: Promocode): boolean {
    const now = new Date();
    const hasActivationSlot =
      promocode.activationLimit === null ||
      promocode.activationLimit > promocode.activationCount;
    const hasValidDate = promocode.validUntil === null || promocode.validUntil > now;

    return hasActivationSlot && hasValidDate;
  }
}
