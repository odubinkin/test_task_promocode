import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promocode } from '../entities/promocode.entity';
import { CreatePromocodeDto } from './dto/create-promocode.dto';

const PROMOCODE_ALREADY_EXISTS_ERROR =
  'Promocode with code "%s" already exists';
const DISCOUNT_RANGE_ERROR = 'discount must be between 1 and 100';
const ACTIVATION_LIMIT_RANGE_ERROR =
  'activation_limit must be null or greater than or equal to 0';
const PROMOCODE_NOT_FOUND_ERROR = 'Promocode with code "%s" not found';

@Injectable()
/**
 * Handles persistence and retrieval logic for promocodes.
 */
export class PromocodesService {
  constructor(
    @InjectRepository(Promocode)
    private readonly promocodeRepository: Repository<Promocode>,
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
   * Returns all promocodes ordered by creation date in descending order.
   */
  list(): Promise<Promocode[]> {
    return this.promocodeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
