import { IsString, Length } from 'class-validator';

export class GetPromocodeParamsDto {
  @IsString()
  @Length(1, 15)
  code: string;
}
