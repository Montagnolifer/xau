import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class OrderProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  reference?: string

  @IsString()
  @IsOptional()
  sku?: string

  @IsNumber()
  @Type(() => Number)
  price: number

  @IsNumber()
  @Type(() => Number)
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
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[]

  @IsNumber()
  @Type(() => Number)
  totalAmount: number

  @IsNumber()
  @Type(() => Number)
  totalItems: number

  @IsString()
  @IsOptional()
  notes?: string
}
