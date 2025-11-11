import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { ProductVariation } from './product-variation.entity'

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

  @Column()
  category: string

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

  @Column({ default: false })
  isFavorite: boolean

  @OneToMany(() => ProductVariation, (variation) => variation.product, { cascade: true })
  variations: ProductVariation[]

  @Column('jsonb', { default: () => "'[]'" })
  images: string[]
} 