import { IsEmail } from 'class-validator';

export class ActivatePromocodeDto {
  @IsEmail()
  email: string;
}
