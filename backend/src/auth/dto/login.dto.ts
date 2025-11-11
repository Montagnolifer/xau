import { IsString, IsNotEmpty, IsMobilePhone } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @IsMobilePhone('pt-BR')
  whatsapp: string;

  @IsString()
  @IsNotEmpty()
  password: string;
} 