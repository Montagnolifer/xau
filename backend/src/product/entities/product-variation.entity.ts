import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Product } from './product.entity'

@Entity('product_variations')
export class ProductVariation {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column('simple-array')
  options: string[]

  @ManyToOne(() => Product, (product) => product.variations, { onDelete: 'CASCADE' })
  product: Product
} 