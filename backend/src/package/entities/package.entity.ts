import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'varchar', length: 100 })
  category: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentPrice: number

  @Column({ type: 'varchar', length: 100 })
  deliveryTime: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string

  @Column({ type: 'boolean', default: true })
  status: boolean

  @Column({ type: 'json', nullable: true })
  highlights: string[]

  @Column({ type: 'json', nullable: true })
  services: Array<{ name: string; description: string }>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
} 