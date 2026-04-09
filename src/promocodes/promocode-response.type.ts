import { Promocode } from '../entities/promocode.entity';

export type PromocodeResponse = {
  code: string;
  discount: number;
  activation_limit: number | null;
  activation_count: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
};

export const toPromocodeResponse = (
  promocode: Promocode,
): PromocodeResponse => ({
  code: promocode.code,
  discount: promocode.discount,
  activation_limit: promocode.activationLimit,
  activation_count: promocode.activationCount,
  valid_until: promocode.validUntil ? promocode.validUntil.toISOString() : null,
  created_at: promocode.createdAt.toISOString(),
  updated_at: promocode.updatedAt.toISOString(),
});
