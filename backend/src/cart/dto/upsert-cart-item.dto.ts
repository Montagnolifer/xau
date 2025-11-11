import { IsNumber, IsOptional, IsString, Min, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

export class UpsertCartItemDto {
  @IsString()
  productId: string

  @IsString()
  name: string

  @IsString()
  @IsOptional()
  reference?: string

  @IsString()
  @IsOptional()
  sku?: string

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number

  @IsString()
  @IsOptional()
  selectedSize?: string

  @IsString()
  @IsOptional()
  selectedColor?: string

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

