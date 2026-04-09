import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivatePromocodeDto {
  @ApiProperty({
    description: 'Email to activate the promocode for',
    format: 'email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
