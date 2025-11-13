import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  MarketplaceAccount,
  MarketplaceProvider,
} from './entities/marketplace-account.entity'

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceAccount)
    private readonly marketplaceRepository: Repository<MarketplaceAccount>,
  ) {}

  async listAccounts(provider?: MarketplaceProvider): Promise<MarketplaceAccount[]> {
    if (provider) {
      return this.marketplaceRepository.find({
        where: { provider },
        order: { createdAt: 'DESC' },
      })
    }

    return this.marketplaceRepository.find({
      order: { createdAt: 'DESC' },
    })
  }

  async getAccountOrFail(
    provider: MarketplaceProvider,
    externalUserId: string,
  ): Promise<MarketplaceAccount> {
    const account = await this.marketplaceRepository.findOne({
      where: { provider, externalUserId },
    })

    if (!account) {
      throw new NotFoundException('Conta de marketplace não encontrada')
    }

    return account
  }

  async upsertAccount(
    provider: MarketplaceProvider,
    externalUserId: string,
    data: Partial<MarketplaceAccount>,
  ): Promise<MarketplaceAccount> {
    let account = await this.marketplaceRepository.findOne({
      where: { provider, externalUserId },
    })

    if (!account) {
      account = this.marketplaceRepository.create({
        provider,
        externalUserId,
        accountName: null,
        scopes: null,
        accessToken: '',
        refreshToken: null,
        tokenExpiresAt: null,
        accountData: null,
      })
    }

    Object.assign(account, data)
    return this.marketplaceRepository.save(account)
  }
}


