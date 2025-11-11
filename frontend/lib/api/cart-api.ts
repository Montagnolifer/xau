import { BaseApiClient } from './base-client'
import { config } from '../config'

export interface CartItemPayload {
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
}

export interface CartItemResponse {
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
  createdAt: string
  updatedAt: string
}

export interface CartUserResponse {
  id: string
  name?: string
  whatsapp?: string
  email?: string
  isWholesale?: boolean
}

export interface CartResponse {
  id: string
  userId: string
  totalAmount: number
  totalItems: number
  items: CartItemResponse[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  user?: CartUserResponse
}

class CartApiClient extends BaseApiClient {
  constructor() {
    super(config.api.baseUrl)
  }

  async getMyCart(): Promise<CartResponse> {
    return this.authenticatedRequest<CartResponse>('/cart/me', {
      method: 'GET',
    })
  }

  async getAllCarts(): Promise<CartResponse[]> {
    return this.authenticatedRequest<CartResponse[]>('/cart', {
      method: 'GET',
    })
  }

  async setCart(payload: { items: CartItemPayload[] }): Promise<CartResponse> {
    return this.authenticatedRequest<CartResponse>('/cart', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  async addOrUpdateItem(payload: CartItemPayload): Promise<CartResponse> {
    return this.authenticatedRequest<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateItem(itemId: string, payload: Partial<CartItemPayload>): Promise<CartResponse> {
    return this.authenticatedRequest<CartResponse>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }

  async removeItem(itemId: string): Promise<CartResponse> {
    return this.authenticatedRequest<CartResponse>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    })
  }

  async clearCart(): Promise<CartResponse> {
    return this.authenticatedRequest<CartResponse>('/cart', {
      method: 'DELETE',
    })
  }
}

export const cartApi = new CartApiClient()

