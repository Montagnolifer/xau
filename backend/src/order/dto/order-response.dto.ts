import { Order, OrderProduct, AdditionalCost } from '../entities/order.entity'
import { User } from '../../user/entities/user.entity'

export interface OrderUserResponse {
  id: string
  name: string
  whatsapp: string
  isWholesale: boolean
}

export class OrderResponseDto {
  id: string
  user: OrderUserResponse
  products: OrderProduct[]
  additionalCosts?: AdditionalCost[]
  totalAmount: number
  totalItems: number
  status: string
  notes?: string
  whatsappSent: boolean
  createdAt: Date
  updatedAt: Date

  constructor(order: Order) {
    this.id = order.id
    this.user = order.user ? {
      id: order.user.id,
      name: order.user.name,
      whatsapp: order.user.whatsapp,
      isWholesale: order.user.isWholesale
    } : {
      id: 'unknown',
      name: 'Usuário não encontrado',
      whatsapp: 'N/A',
      isWholesale: false
    }
    this.products = order.products
    this.additionalCosts = order.additionalCosts || []
    this.totalAmount = order.totalAmount
    this.totalItems = order.totalItems
    this.status = order.status
    this.notes = order.notes
    this.whatsappSent = order.whatsappSent
    this.createdAt = order.createdAt
    this.updatedAt = order.updatedAt
  }
}
