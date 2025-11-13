import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class ImportMercadoLivreProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  productIds: string[]

  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number

  @IsOptional()
  @IsString()
  categoryName?: string | null
}

