import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export type MarketplaceProvider = 'mercado_livre'

@Entity('marketplaces')
@Index(['provider', 'externalUserId'], { unique: true })
export class MarketplaceAccount {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100 })
  provider: MarketplaceProvider

  @Column({ name: 'external_user_id', type: 'varchar', length: 255 })
  externalUserId: string

  @Column({ name: 'account_name', type: 'varchar', length: 255, nullable: true })
  accountName: string | null

  @Column({ name: 'scopes', type: 'text', nullable: true })
  scopes: string | null

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null

  @Column({ name: 'token_expires_at', type: 'timestamp with time zone', nullable: true })
  tokenExpiresAt: Date | null

  @Column({ name: 'account_data', type: 'jsonb', nullable: true })
  accountData: Record<string, any> | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

