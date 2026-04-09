import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromocodeDto {
  @ApiProperty({
    description: 'Promocode identifier',
    minLength: 1,
    maxLength: 15,
    example: 'SPRING24',
  })
  @IsString()
  @Length(1, 15)
  code: string;

  @ApiProperty({
    description: 'Discount percentage',
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  discount: number;

  @ApiPropertyOptional({
    description: 'Maximum number of activations. `null` means unlimited.',
    nullable: true,
    minimum: 0,
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  activation_limit: number | null;

  @ApiPropertyOptional({
    description:
      'Promocode expiration timestamp in ISO 8601 format. `null` means no expiration.',
    nullable: true,
    format: 'date-time',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  valid_until: string | null;
}
