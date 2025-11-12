import { Controller, Get, Query } from '@nestjs/common'
import { MarketplaceService } from './marketplace.service'
import { MarketplaceProvider } from './entities/marketplace-account.entity'

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('accounts')
  async listAccounts(
    @Query('provider') provider?: MarketplaceProvider,
  ) {
    const accounts = await this.marketplaceService.listAccounts(provider)

    return accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      externalUserId: account.externalUserId,
      accountName: account.accountName,
      scopes: account.scopes,
      tokenExpiresAt: account.tokenExpiresAt,
      accountData: account.accountData,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }))
  }
}

