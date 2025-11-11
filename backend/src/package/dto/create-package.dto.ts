import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, Min, IsNotEmpty, ValidateNested } from 'class-validator'
import { Type, Transform } from 'class-transformer'

class ServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string
}

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsString()
  @IsNotEmpty()
  category: string

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  originalPrice: number

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  currentPrice: number

  @IsString()
  @IsNotEmpty()
  deliveryTime: string

  @IsString()
  @IsOptional()
  image?: string

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  status?: boolean

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  highlights?: string[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  @IsOptional()
  services?: ServiceDto[]
} 