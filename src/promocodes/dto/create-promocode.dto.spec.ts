import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreatePromocodeDto } from './create-promocode.dto';

describe('CreatePromocodeDto', () => {
  it('accepts valid payload with optional null fields', () => {
    const dto = plainToInstance(CreatePromocodeDto, {
      code: 'WELCOME',
      discount: 25,
      activation_limit: null,
      valid_until: null,
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects too long code', () => {
    const dto = plainToInstance(CreatePromocodeDto, {
      code: 'ABCDEFGHIJKLMNOP',
      discount: 25,
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('code');
    expect(errors[0]?.constraints).toHaveProperty('isLength');
  });

  it('rejects discount out of range', () => {
    const dto = plainToInstance(CreatePromocodeDto, {
      code: 'WELCOME',
      discount: 101,
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('discount');
    expect(errors[0]?.constraints).toHaveProperty('max');
  });

  it('rejects negative activation_limit', () => {
    const dto = plainToInstance(CreatePromocodeDto, {
      code: 'WELCOME',
      discount: 10,
      activation_limit: -1,
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('activation_limit');
    expect(errors[0]?.constraints).toHaveProperty('min');
  });

  it('rejects non-ISO strict valid_until', () => {
    const dto = plainToInstance(CreatePromocodeDto, {
      code: 'WELCOME',
      discount: 10,
      valid_until: '2026-1-1',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('valid_until');
    expect(errors[0]?.constraints).toHaveProperty('isIso8601');
  });
});
