import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../user/entities/user.entity'

export interface OrderProduct {
  productId: string
  name: string
  reference?: string
  sku?: string
  price: number
  quantity: number
  selectedSize?: string
  selectedColor?: string
  imageUrl?: string
}

export interface AdditionalCost {
  id: string
  name: string
  description?: string
  amount: number
  type: 'personalization' | 'shipping' | 'box' | 'other'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  userId: string

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column('json')
  products: OrderProduct[]

  @Column('json', { nullable: true })
  additionalCosts?: AdditionalCost[]

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number

  @Column('int')
  totalItems: number

  @Column({ default: 'pending' })
  status: string

  @Column({ nullable: true })
  notes?: string

  @Column({ default: false })
  whatsappSent: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
