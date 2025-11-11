import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { UpsertCartItemDto } from './upsert-cart-item.dto'

export class SetCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertCartItemDto)
  items: UpsertCartItemDto[]
}

