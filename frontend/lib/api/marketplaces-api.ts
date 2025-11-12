import { BaseApiClient } from './base-client'
import { config } from '../config'

export type MarketplaceAccount = {
  id: number
  provider: string
  externalUserId: string
  accountName: string | null
  scopes: string | null
  tokenExpiresAt: string | null
  accountData: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

type AuthorizationResponse = {
  authorizationUrl: string
  state: string
}

class MarketplacesApi extends BaseApiClient {
  constructor() {
    super(config.api.baseUrl)
  }

  async listAccounts(provider?: string): Promise<MarketplaceAccount[]> {
    const query = provider ? `?provider=${provider}` : ''
    return this.authenticatedRequest<MarketplaceAccount[]>(
      `/marketplace/accounts${query}`,
      {
        method: 'GET',
      },
    )
  }

  async authorizeMercadoLivre(): Promise<AuthorizationResponse> {
    return this.authenticatedRequest<AuthorizationResponse>(
      '/marketplace/ml/authorize',
      {
        method: 'POST',
      },
    )
  }
}

export const marketplacesApi = new MarketplacesApi()

