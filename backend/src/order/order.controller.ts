import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Patch,
  UseGuards,
  Request,
  BadRequestException
} from '@nestjs/common'
import { OrderService } from './order.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { OrderResponseDto } from './dto/order-response.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: any
  ): Promise<OrderResponseDto> {
    // Verificar se é um usuário comum (não admin)
    if (req.user?.role === 'admin') {
      throw new BadRequestException('Administradores não podem criar pedidos. Faça login como usuário comum.')
    }

    // Usar o ID do usuário autenticado
    if (req.user) {
      createOrderDto.userId = req.user.id
    }
    return this.orderService.create(createOrderDto)
  }

  @Get()
  async findAll(): Promise<OrderResponseDto[]> {
    return this.orderService.findAll()
  }

  @Get('my-orders')
  async findMyOrders(@Request() req: any): Promise<OrderResponseDto[]> {
    return this.orderService.findByUser(req.user.id)
  }

  @Get('counts/by-users')
  async getOrderCountsByUsers(): Promise<{ userId: string; count: number }[]> {
    return this.orderService.getOrderCountsByUsers()
  }

  @Get('count/:userId')
  async getOrderCountByUser(@Param('userId') userId: string): Promise<{ count: number }> {
    const count = await this.orderService.getOrderCountByUser(userId)
    return { count }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.orderService.findOne(id)
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ): Promise<OrderResponseDto> {
    return this.orderService.updateStatus(id, status)
  }

  @Patch(':id/whatsapp-sent')
  async markWhatsappSent(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.orderService.markWhatsappSent(id)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto
  ): Promise<OrderResponseDto> {
    console.log('📝 Update Order Request:', {
      id,
      updateOrderDto: JSON.stringify(updateOrderDto, null, 2)
    });
    return this.orderService.update(id, updateOrderDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.orderService.remove(id)
  }
}
