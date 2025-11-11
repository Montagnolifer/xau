import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { Cart } from './entities/cart.entity'
import { CartItem } from './entities/cart-item.entity'
import { SetCartDto } from './dto/set-cart.dto'
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'
import { CartResponseDto } from './dto/cart-response.dto'
import { User } from '../user/entities/user.entity'

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getCartByUser(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId)
    const syncedCart = await this.syncTotals(cart.id)
    return new CartResponseDto(syncedCart)
  }

  async getAllCarts(): Promise<CartResponseDto[]> {
    const carts = await this.cartRepository.find({ relations: ['items', 'user'] })
    const syncedCarts = await Promise.all(
      carts.map(async cart => {
        const syncedCart = await this.syncTotals(cart.id)
        return new CartResponseDto(syncedCart)
      }),
    )
    return syncedCarts
  }

  async setCart(userId: string, setCartDto: SetCartDto): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId)

    await this.cartItemRepository.delete({ cartId: cart.id })

    if (setCartDto.items?.length) {
      const items = setCartDto.items.map(item =>
        this.cartItemRepository.create({
          ...item,
          selectedSize: item.selectedSize ?? undefined,
          selectedColor: item.selectedColor ?? undefined,
          cartId: cart.id,
        }),
      )
      await this.cartItemRepository.save(items)
    }

    const syncedCart = await this.syncTotals(cart.id)
    return new CartResponseDto(syncedCart)
  }

  async addOrUpdateItem(userId: string, dto: UpsertCartItemDto): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId)

    const existingItem = await this.cartItemRepository.findOne({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        selectedSize: dto.selectedSize ?? IsNull(),
        selectedColor: dto.selectedColor ?? IsNull(),
      },
    })

    if (existingItem) {
      existingItem.name = dto.name
      existingItem.reference = dto.reference ?? undefined
      existingItem.sku = dto.sku ?? undefined
      existingItem.price = dto.price
      existingItem.quantity = dto.quantity
      existingItem.selectedSize = dto.selectedSize ?? undefined
      existingItem.selectedColor = dto.selectedColor ?? undefined
      existingItem.imageUrl = dto.imageUrl ?? undefined
      existingItem.metadata = dto.metadata ?? undefined
      await this.cartItemRepository.save(existingItem)
    } else {
      const newItem = this.cartItemRepository.create({
        ...dto,
        reference: dto.reference ?? undefined,
        sku: dto.sku ?? undefined,
        selectedSize: dto.selectedSize ?? undefined,
        selectedColor: dto.selectedColor ?? undefined,
        imageUrl: dto.imageUrl ?? undefined,
        metadata: dto.metadata ?? undefined,
        cartId: cart.id,
      })

      await this.cartItemRepository.save(newItem)
    }

    const syncedCart = await this.syncTotals(cart.id)
    return new CartResponseDto(syncedCart)
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId)

    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    })

    if (!item) {
      throw new NotFoundException('Item do carrinho não encontrado')
    }

    if (dto.productId !== undefined) {
      item.productId = dto.productId
    }
    if (dto.name !== undefined) {
      item.name = dto.name
    }
    if (dto.reference !== undefined) {
      item.reference = dto.reference ?? undefined
    }
    if (dto.sku !== undefined) {
      item.sku = dto.sku ?? undefined
    }
    if (dto.price !== undefined) {
      item.price = dto.price
    }
    if (dto.quantity !== undefined) {
      if (dto.quantity < 1) {
        throw new BadRequestException('Quantidade deve ser maior ou igual a 1')
      }
      item.quantity = dto.quantity
    }
    if (dto.selectedSize !== undefined) {
      item.selectedSize = dto.selectedSize ?? undefined
    }
    if (dto.selectedColor !== undefined) {
      item.selectedColor = dto.selectedColor ?? undefined
    }
    if (dto.imageUrl !== undefined) {
      item.imageUrl = dto.imageUrl ?? undefined
    }
    if (dto.metadata !== undefined) {
      item.metadata = dto.metadata ?? undefined
    }

    await this.cartItemRepository.save(item)

    const syncedCart = await this.syncTotals(cart.id)
    return new CartResponseDto(syncedCart)
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId)

    const result = await this.cartItemRepository.delete({ id: itemId, cartId: cart.id })

    if (!result.affected) {
      throw new NotFoundException('Item do carrinho não encontrado')
    }

    const syncedCart = await this.syncTotals(cart.id)
    return new CartResponseDto(syncedCart)
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId)
    await this.cartItemRepository.delete({ cartId: cart.id })
    const syncedCart = await this.syncTotals(cart.id)
    return new CartResponseDto(syncedCart)
  }

  private async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({ where: { userId } })

    if (!cart) {
      const user = await this.userRepository.findOne({ where: { id: userId } })
      if (!user) {
        throw new NotFoundException('Usuário não encontrado')
      }

      cart = this.cartRepository.create({
        userId,
        totalAmount: 0,
        totalItems: 0,
        items: [],
      })

      const savedCart = await this.cartRepository.save(cart)
      return this.loadCart(savedCart.id)
    }

    return this.loadCart(cart.id)
  }

  private async loadCart(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'user'],
    })

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado')
    }

    return cart
  }

  private async syncTotals(cartId: string): Promise<Cart> {
    const cart = await this.loadCart(cartId)
    const { totalAmount, totalItems } = this.calculateTotals(cart.items ?? [])
    const currentAmount = Number(cart.totalAmount)
    if (currentAmount !== totalAmount || cart.totalItems !== totalItems) {
      await this.cartRepository.update(cartId, {
        totalAmount,
        totalItems,
      })
      cart.totalAmount = totalAmount
      cart.totalItems = totalItems
    } else {
      cart.totalAmount = currentAmount
    }
    return cart
  }

  private calculateTotals(items: CartItem[]): { totalAmount: number; totalItems: number } {
    return items.reduce(
      (acc, item) => {
        const price = Number(item.price)
        const quantity = item.quantity || 0
        acc.totalAmount += price * quantity
        acc.totalItems += quantity
        return acc
      },
      { totalAmount: 0, totalItems: 0 },
    )
  }
}

