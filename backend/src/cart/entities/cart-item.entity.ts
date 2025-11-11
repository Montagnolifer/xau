import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm'
import { Cart } from './cart.entity'

@Entity('cart_items')
@Unique('UQ_cart_item_unique', ['cartId', 'productId', 'selectedSize', 'selectedColor'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  cartId: string

  @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: Cart

  @Column({ type: 'varchar', length: 255 })
  productId: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string

  @Column('decimal', { precision: 10, scale: 2 })
  price: number

  @Column('int', { default: 1 })
  quantity: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  selectedSize?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  selectedColor?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

