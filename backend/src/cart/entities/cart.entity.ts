import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm'
import { User } from '../../user/entities/user.entity'
import { CartItem } from './cart-item.entity'

@Entity('carts')
@Unique(['userId'])
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  userId: string

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  @OneToMany(() => CartItem, item => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItem[]

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number

  @Column('int', { default: 0 })
  totalItems: number

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

