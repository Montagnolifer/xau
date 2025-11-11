import { Cart } from '../entities/cart.entity'
import { CartItem } from '../entities/cart-item.entity'
import { User } from '../../user/entities/user.entity'

export class CartItemResponseDto {
  id: string
  productId: string
  name: string
  reference?: string
  sku?: string
  price: number
  quantity: number
  selectedSize?: string
  selectedColor?: string
  imageUrl?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date

  constructor(item: CartItem) {
    this.id = item.id
    this.productId = item.productId
    this.name = item.name
    this.reference = item.reference
    this.sku = item.sku
    this.price = Number(item.price)
    this.quantity = item.quantity
    this.selectedSize = item.selectedSize
    this.selectedColor = item.selectedColor
    this.imageUrl = item.imageUrl
    this.metadata = item.metadata ?? undefined
    this.createdAt = item.createdAt
    this.updatedAt = item.updatedAt
  }
}

export class CartUserResponseDto {
  id: string
  name?: string
  whatsapp?: string
  isWholesale?: boolean

  constructor(user: User) {
    this.id = user.id
    this.name = user.name ?? undefined
    this.whatsapp = user.whatsapp ?? undefined
    this.isWholesale = user.isWholesale ?? undefined
  }
}

export class CartResponseDto {
  id: string
  userId: string
  totalAmount: number
  totalItems: number
  items: CartItemResponseDto[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  user?: CartUserResponseDto

  constructor(cart: Cart) {
    this.id = cart.id
    this.userId = cart.userId
    this.totalAmount = Number(cart.totalAmount)
    this.totalItems = cart.totalItems
    this.items = (cart.items ?? []).map(item => new CartItemResponseDto(item))
    this.metadata = cart.metadata ?? undefined
    this.createdAt = cart.createdAt
    this.updatedAt = cart.updatedAt
    this.user = cart.user ? new CartUserResponseDto(cart.user) : undefined
  }
}

