import { IsString, IsNotEmpty, IsMobilePhone, IsBoolean, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsMobilePhone('pt-BR')
  whatsapp: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsOptional()
  agreeMarketing?: boolean;
} 