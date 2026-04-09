import { ApiProperty } from '@nestjs/swagger';

export class PromocodeResponseDto {
  @ApiProperty({
    description: 'Promocode identifier',
    minLength: 1,
    maxLength: 15,
    example: 'SPRING24',
  })
  code: string;

  @ApiProperty({
    description: 'Discount percentage',
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  discount: number;

  @ApiProperty({
    description: 'Maximum allowed activations. `null` means unlimited.',
    nullable: true,
    minimum: 0,
    example: 100,
  })
  activation_limit: number | null;

  @ApiProperty({
    description: 'Current number of successful activations',
    minimum: 0,
    example: 5,
  })
  activation_count: number;

  @ApiProperty({
    description:
      'Expiration datetime in ISO 8601 format. `null` means no expiration.',
    nullable: true,
    format: 'date-time',
    example: '2026-12-31T23:59:59.000Z',
  })
  valid_until: string | null;

  @ApiProperty({
    description: 'Promocode creation timestamp in ISO 8601 format',
    format: 'date-time',
    example: '2026-04-01T10:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Promocode update timestamp in ISO 8601 format',
    format: 'date-time',
    example: '2026-04-02T08:30:00.000Z',
  })
  updated_at: string;
}
