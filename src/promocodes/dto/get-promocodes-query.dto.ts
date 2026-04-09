import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const SORT_BY_FIELDS = [
  'createdAt',
  'updatedAt',
  'validUntil',
  'discount',
  'activationLimit',
] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;
export const PROMOCODES_LIST_MAX_LIMIT = 1000;

export type PromocodeSortBy = (typeof SORT_BY_FIELDS)[number];
export type PromocodeSortOrder = (typeof SORT_ORDERS)[number];

export class GetPromocodesQueryDto {
  @ApiPropertyOptional({
    description: 'Number of records to return',
    minimum: 0,
    maximum: PROMOCODES_LIST_MAX_LIMIT,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PROMOCODES_LIST_MAX_LIMIT)
  limit = 20;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @ApiPropertyOptional({
    description: 'Field used for sorting',
    enum: SORT_BY_FIELDS,
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy: PromocodeSortBy = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order direction',
    enum: SORT_ORDERS,
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder: PromocodeSortOrder = 'desc';
}
