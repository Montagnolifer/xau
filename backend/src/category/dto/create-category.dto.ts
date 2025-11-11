import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  status?: boolean

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined
    }
    if (value === null) {
      return null
    }
    return Number(value)
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  parentId?: number | null

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined
    }
    if (value === null) {
      return null
    }
    return Number(value)
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  position?: number | null
}

