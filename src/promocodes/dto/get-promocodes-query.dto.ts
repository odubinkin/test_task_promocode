import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

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
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PROMOCODES_LIST_MAX_LIMIT)
  limit = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy: PromocodeSortBy = 'createdAt';

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder: PromocodeSortOrder = 'desc';
}
