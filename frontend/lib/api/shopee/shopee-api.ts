import { BaseApiClient } from '../base-client'
import { config } from '../../config'

type AuthorizationResponse = {
  authorizationUrl: string
  state: string
}

class ShopeeApi extends BaseApiClient {
  constructor() {
    super(config.api.baseUrl)
  }

  async authorizeShopee(): Promise<AuthorizationResponse> {
    return this.authenticatedRequest<AuthorizationResponse>(
      '/marketplace/shopee/authorize',
      {
        method: 'POST',
      },
    )
  }
}

export const shopeeApi = new ShopeeApi()
