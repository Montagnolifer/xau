import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min, IsNotEmpty, IsObject } from 'class-validator'
import { Type, Transform } from 'class-transformer'

class CreateProductVariationDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsArray()
  @IsString({ each: true })
  options: string[]
}

class CreateProductVariantItemDto {
  @IsObject()
  options: Record<string, string>

  @IsOptional()
  @IsString()
  sku?: string

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  })
  price: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  wholesalePrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  priceUSD?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  wholesalePriceUSD?: number

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  })
  stock: number
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  price?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  wholesalePrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  priceUSD?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  wholesalePriceUSD?: number

  @IsString()
  @IsNotEmpty()
  category: string

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  categoryId?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  stock?: number

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true'
    }
    return Boolean(value)
  })
  status?: boolean

  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  weight?: number

  @IsOptional()
  @IsString()
  dimensions?: string

  @IsOptional()
  @IsString()
  youtubeUrl?: string

  @IsOptional()
  @IsString()
  paymentLink?: string

  @IsOptional()
  @IsString()
  mercadoLivreId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariationDto)
  variations?: CreateProductVariationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariationDto)
  variationAxes?: CreateProductVariationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantItemDto)
  variantItems?: CreateProductVariantItemDto[]
} 