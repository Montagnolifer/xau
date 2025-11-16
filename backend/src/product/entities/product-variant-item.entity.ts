import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm'
import { Product } from './product.entity'

@Entity('product_variant_items')
@Index(['product', 'options'], { unique: true })
export class ProductVariantItem {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Product, (product) => product.variantItems, { onDelete: 'CASCADE' })
  product: Product

  @Column({ type: 'jsonb' })
  options: Record<string, string>

  @Column({ type: 'varchar', length: 255, nullable: true })
  sku?: string | null

  @Column('decimal', { precision: 10, scale: 2 })
  price: number

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  wholesalePrice?: number | null

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceUSD?: number | null

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  wholesalePriceUSD?: number | null

  @Column('int', { default: 0 })
  stock: number
}

