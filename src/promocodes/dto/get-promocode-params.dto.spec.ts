import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { GetPromocodeParamsDto } from './get-promocode-params.dto';

describe('GetPromocodeParamsDto', () => {
  it('accepts code with max length', () => {
    const dto = plainToInstance(GetPromocodeParamsDto, {
      code: 'ABCDEFGHIJKLMNO',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects empty code', () => {
    const dto = plainToInstance(GetPromocodeParamsDto, {
      code: '',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('code');
    expect(errors[0]?.constraints).toHaveProperty('isLength');
  });

  it('rejects code longer than 15 symbols', () => {
    const dto = plainToInstance(GetPromocodeParamsDto, {
      code: 'ABCDEFGHIJKLMNOP',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('code');
    expect(errors[0]?.constraints).toHaveProperty('isLength');
  });
});
