import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from './entities/order.entity'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { OrderResponseDto } from './dto/order-response.dto'
import { User } from '../user/entities/user.entity'

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Verificar se o usuário existe (apenas usuários comuns podem criar pedidos)
    const user = await this.userRepository.findOne({ where: { id: createOrderDto.userId } })
    
    if (!user) {
      throw new BadRequestException(`Usuário com ID ${createOrderDto.userId} não encontrado. Apenas usuários comuns podem criar pedidos.`)
    }

    const order = this.orderRepository.create({
      userId: createOrderDto.userId,
      products: createOrderDto.products,
      totalAmount: createOrderDto.totalAmount,
      totalItems: createOrderDto.totalItems,
      notes: createOrderDto.notes,
      status: 'pending',
      whatsappSent: false,
    })

    const savedOrder = await this.orderRepository.save(order)
    return new OrderResponseDto(savedOrder)
  }

  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
    })
    return orders.map(order => new OrderResponseDto(order))
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({ where: { id } })
    
    if (!order) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`)
    }

    return new OrderResponseDto(order)
  }

  async findByUser(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    })
    return orders.map(order => new OrderResponseDto(order))
  }

  async getOrderCountByUser(userId: string): Promise<number> {
    return await this.orderRepository.count({
      where: { userId }
    })
  }

  async getOrderCountsByUsers(): Promise<{ userId: string; count: number }[]> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.userId')
      .getRawMany()
    
    return result.map(row => ({
      userId: row.userId,
      count: parseInt(row.count)
    }))
  }

  async updateStatus(id: string, status: string): Promise<OrderResponseDto> {
    const order = await this.findOne(id)
    
    await this.orderRepository.update(id, { status })
    
    const updatedOrder = await this.findOne(id)
    return updatedOrder
  }

  async markWhatsappSent(id: string): Promise<OrderResponseDto> {
    const order = await this.findOne(id)
    
    await this.orderRepository.update(id, { whatsappSent: true })
    
    const updatedOrder = await this.findOne(id)
    return updatedOrder
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderResponseDto> {
    console.log('🔧 OrderService.update called with:', {
      id,
      updateOrderDto: JSON.stringify(updateOrderDto, null, 2)
    });
    
    const order = await this.findOne(id)
    
    const updateData: Partial<Order> = {}
    
    if (updateOrderDto.products !== undefined) {
      console.log('📦 Updating products:', updateOrderDto.products);
      updateData.products = updateOrderDto.products as any
    }
    
    if (updateOrderDto.additionalCosts !== undefined) {
      console.log('💰 Updating additionalCosts:', updateOrderDto.additionalCosts);
      updateData.additionalCosts = updateOrderDto.additionalCosts
    }
    
    if (updateOrderDto.totalAmount !== undefined) {
      console.log('💵 Updating totalAmount:', updateOrderDto.totalAmount);
      updateData.totalAmount = updateOrderDto.totalAmount
    }
    
    if (updateOrderDto.totalItems !== undefined) {
      console.log('📊 Updating totalItems:', updateOrderDto.totalItems);
      updateData.totalItems = updateOrderDto.totalItems
    }
    
    if (updateOrderDto.notes !== undefined) {
      console.log('📝 Updating notes:', updateOrderDto.notes);
      updateData.notes = updateOrderDto.notes
    }
    
    if (updateOrderDto.status !== undefined) {
      console.log('🔄 Updating status:', updateOrderDto.status);
      updateData.status = updateOrderDto.status
    }
    
    if (updateOrderDto.whatsappSent !== undefined) {
      console.log('📱 Updating whatsappSent:', updateOrderDto.whatsappSent);
      updateData.whatsappSent = updateOrderDto.whatsappSent
    }

    if (updateOrderDto.userId !== undefined) {
      console.log('👤 Updating userId:', updateOrderDto.userId);
      // Verificar se o novo usuário existe
      const newUser = await this.userRepository.findOne({ where: { id: updateOrderDto.userId } });
      if (!newUser) {
        throw new BadRequestException(`Usuário com ID ${updateOrderDto.userId} não encontrado`);
      }
      updateData.userId = updateOrderDto.userId;
    }

    await this.orderRepository.update(id, updateData)
    
    const updatedOrder = await this.findOne(id)
    return updatedOrder
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id)
    await this.orderRepository.remove(order as any)
  }
}
