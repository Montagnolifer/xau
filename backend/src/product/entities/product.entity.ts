import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm'
import { ProductVariation } from './product-variation.entity'
import { ProductVariantItem } from './product-variant-item.entity'
import { Category } from '../../category/entities/category.entity'

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column('decimal', { precision: 10, scale: 2 })
  price: number

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  wholesalePrice: number

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceUSD: number

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  wholesalePriceUSD: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  category: string | null

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  categoryEntity?: Category | null

  @RelationId((product: Product) => product.categoryEntity)
  categoryId?: number | null

  @Column('int')
  stock: number

  @Column({ default: true })
  status: boolean

  @Column({ nullable: true })
  sku: string

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weight: number

  @Column({ nullable: true })
  dimensions: string

  @Column({ nullable: true })
  youtubeUrl: string

  @Column({ name: 'payment_link', type: 'varchar', length: 255, nullable: true })
  paymentLink: string | null

  @Column({ default: false })
  isFavorite: boolean

  @Column({ name: 'mercado_livre_id', type: 'varchar', length: 255, nullable: true })
  mercadoLivreId: string | null

  @OneToMany(() => ProductVariation, (variation) => variation.product, { cascade: true })
  variations: ProductVariation[]

  @Column('jsonb', { default: () => "'[]'" })
  images: string[]

  @OneToMany(() => ProductVariantItem, (item) => item.product, { cascade: true })
  variantItems: ProductVariantItem[]
} 