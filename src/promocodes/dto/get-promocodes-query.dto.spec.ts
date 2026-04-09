import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  GetPromocodesQueryDto,
  PROMOCODES_LIST_MAX_LIMIT,
} from './get-promocodes-query.dto';

describe('GetPromocodesQueryDto', () => {
  it('accepts limit equal to max limit constant', () => {
    const dto = plainToInstance(GetPromocodesQueryDto, {
      limit: PROMOCODES_LIST_MAX_LIMIT,
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects limit greater than max limit constant', () => {
    const dto = plainToInstance(GetPromocodesQueryDto, {
      limit: PROMOCODES_LIST_MAX_LIMIT + 1,
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('limit');
    expect(errors[0]?.constraints).toHaveProperty('max');
  });
});
