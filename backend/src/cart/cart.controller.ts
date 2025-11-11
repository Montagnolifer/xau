import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common'
import { CartService } from './cart.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SetCartDto } from './dto/set-cart.dto'
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'
import { CartResponseDto } from './dto/cart-response.dto'

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getAllCarts(@Request() req: any): Promise<CartResponseDto[]> {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Acesso permitido somente para administradores')
    }

    return this.cartService.getAllCarts()
  }

  @Get('me')
  async getMyCart(@Request() req: any): Promise<CartResponseDto> {
    return this.cartService.getCartByUser(req.user.id)
  }

  @Put()
  async setCart(@Request() req: any, @Body() setCartDto: SetCartDto): Promise<CartResponseDto> {
    return this.cartService.setCart(req.user.id, setCartDto)
  }

  @Post('items')
  async addOrUpdateItem(@Request() req: any, @Body() dto: UpsertCartItemDto): Promise<CartResponseDto> {
    return this.cartService.addOrUpdateItem(req.user.id, dto)
  }

  @Patch('items/:itemId')
  async updateItem(
    @Request() req: any,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(req.user.id, itemId, dto)
  }

  @Delete('items/:itemId')
  async removeItem(@Request() req: any, @Param('itemId') itemId: string): Promise<CartResponseDto> {
    return this.cartService.removeItem(req.user.id, itemId)
  }

  @Delete()
  async clearCart(@Request() req: any): Promise<CartResponseDto> {
    return this.cartService.clearCart(req.user.id)
  }
}

