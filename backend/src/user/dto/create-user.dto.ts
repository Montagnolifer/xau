import { IsString, IsNotEmpty, MinLength, IsBoolean, IsOptional, Matches, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'WhatsApp é obrigatório' })
  @Matches(/^[0-9+\-\s()]+$/, { message: 'WhatsApp deve conter apenas números e caracteres válidos' })
  whatsapp: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @IsBoolean()
  @IsOptional()
  agreeMarketing?: boolean;

  @IsString()
  @IsOptional()
  @Length(8, 8, { message: 'CEP deve ter exatamente 8 dígitos' })
  @Matches(/^[0-9]{8}$/, { message: 'CEP deve conter apenas números' })
  zipCode?: string;

  @IsBoolean()
  @IsOptional()
  isWholesale?: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^(BRL|USD)$/, { message: 'Moeda deve ser BRL ou USD' })
  currency?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(pt|es)$/, { message: 'Idioma deve ser pt (Português) ou es (Espanhol)' })
  language?: string;
} 