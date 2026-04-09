import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPromocodeParamsDto {
  @ApiProperty({
    description: 'Promocode identifier',
    minLength: 1,
    maxLength: 15,
    example: 'SPRING24',
  })
  @IsString()
  @Length(1, 15)
  code: string;
}
