import { PartialType } from '@nestjs/mapped-types'
import { CreateCategoryDto } from './create-category.dto'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, ValidateIf } from 'class-validator'

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
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
}

