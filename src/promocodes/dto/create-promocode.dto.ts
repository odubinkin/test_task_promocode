import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreatePromocodeDto {
  @IsString()
  @Length(1, 15)
  code: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  activation_limit: number | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  valid_until: string | null;
}
