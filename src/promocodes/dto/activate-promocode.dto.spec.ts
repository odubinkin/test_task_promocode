import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ActivatePromocodeDto } from './activate-promocode.dto';

describe('ActivatePromocodeDto', () => {
  it('accepts a valid email', () => {
    const dto = plainToInstance(ActivatePromocodeDto, {
      email: 'user@example.com',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', () => {
    const dto = plainToInstance(ActivatePromocodeDto, {
      email: 'invalid-email',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('email');
    expect(errors[0]?.constraints).toHaveProperty('isEmail');
  });
});
