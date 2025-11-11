import { PartialType } from '@nestjs/mapped-types'
import { UpsertCartItemDto } from './upsert-cart-item.dto'

export class UpdateCartItemDto extends PartialType(UpsertCartItemDto) {}

