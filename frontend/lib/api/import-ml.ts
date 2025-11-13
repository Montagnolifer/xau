import { BaseApiClient } from './base-client'
import { config } from '../config'

export type MarketplaceImportProduct = {
  id: string
  title: string
  price: number
  currency: string
  availableQuantity: number
  permalink?: string | null
  thumbnail?: string | null
  status?: string | null
  lastUpdated?: string | null
}

export type MarketplaceImportListResponse = {
  accountId: number
  provider: string
  accountName?: string | null
  fetchedAt: string
  products: MarketplaceImportProduct[]
}

export type ImportMarketplaceProductsPayload = {
  productIds: string[]
  categoryId: number
  categoryName?: string | null
}

export type ImportMarketplaceProductsResponse = {
  imported: number
  failed: number
  errors?: Array<{ productId: string; message: string }>
}

class ImportMarketplaceApi extends BaseApiClient {
  constructor() {
    super(config.api.baseUrl)
  }

  async listProducts(accountId: number): Promise<MarketplaceImportListResponse> {
    return this.authenticatedRequest<MarketplaceImportListResponse>(
      `/marketplace/ml/accounts/${accountId}/products`,
      { method: 'GET' },
    )
  }

  async importProducts(
    accountId: number,
    payload: ImportMarketplaceProductsPayload,
  ): Promise<ImportMarketplaceProductsResponse> {
    return this.authenticatedRequest<ImportMarketplaceProductsResponse>(
      `/marketplace/ml/accounts/${accountId}/import`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  }
}

export const importMlApi = new ImportMarketplaceApi()

