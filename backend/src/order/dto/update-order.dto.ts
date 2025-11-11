import { IsOptional, IsString, IsNumber, IsArray, IsEnum, ValidateNested, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'
import { AdditionalCost } from '../entities/order.entity'

export class UpdateAdditionalCostDto {
  @IsString()
  id: string

  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  @Type(() => Number)
  amount: number

  @IsEnum(['personalization', 'shipping', 'box', 'other'])
  type: 'personalization' | 'shipping' | 'box' | 'other'
}

export class UpdateOrderProductDto {
  @IsString()
  productId: string

  @IsString()
  name: string

  @IsOptional()
  @IsString()
  reference?: string

  @IsOptional()
  @IsString()
  sku?: string

  @IsNumber()
  @Type(() => Number)
  quantity: number

  @IsNumber()
  @Type(() => Number)
  price: number

  @IsOptional()
  @IsString()
  selectedSize?: string

  @IsOptional()
  @IsString()
  selectedColor?: string

  @IsOptional()
  @IsString()
  imageUrl?: string
}

export class UpdateOrderDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderProductDto)
  products?: UpdateOrderProductDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAdditionalCostDto)
  additionalCosts?: UpdateAdditionalCostDto[]

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalAmount?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalItems?: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'cancelled'])
  status?: string

  @IsOptional()
  @IsBoolean()
  whatsappSent?: boolean

  @IsOptional()
  @IsString()
  userName?: string

  @IsOptional()
  @IsString()
  userId?: string
}
