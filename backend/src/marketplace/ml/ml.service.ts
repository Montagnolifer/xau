import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { AxiosError, AxiosResponse } from 'axios'
import { lastValueFrom } from 'rxjs'
import { randomBytes } from 'crypto'
import { MarketplaceService } from '../marketplace.service'
import { MarketplaceAccount } from '../entities/marketplace-account.entity'
import { ImportMercadoLivreProductsDto } from './dto/import-ml-products.dto'
import { ProductService } from '../../product/product.service'
import { mapMercadoLivreItemToCreateProduct } from './utils/ml-product.mapper'

type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  refresh_token: string
}

type MercadoLivreProfile = {
  id: number
  nickname: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  country_id: string | null
  permalink: string | null
  site_id: string | null
  status: Record<string, unknown>
}

type MercadoLivreItemsSearchResponse = {
  results: string[]
  paging?: {
    total?: number
    offset?: number
    limit?: number
  }
}

type MercadoLivreItemPicture = {
  id: string
  url: string
  secure_url?: string
}

type MercadoLivreItemVariationAttribute = {
  id: string
  name: string
  value_id?: string | null
  value_name?: string | null
}

type MercadoLivreItemVariation = {
  id: number
  price?: number
  available_quantity?: number
  attribute_combinations?: MercadoLivreItemVariationAttribute[]
}

type MercadoLivreItemDetail = {
  id: string
  title: string
  price: number
  currency_id: string
  available_quantity: number
  permalink: string
  thumbnail?: string | null
  secure_thumbnail?: string | null
  status: string
  last_updated?: string
  category_id?: string
  seller_custom_field?: string | null
  variations?: MercadoLivreItemVariation[]
  attributes?: Array<{ id: string; name: string; value_name: string | null }>
  pictures?: MercadoLivreItemPicture[]
}

type MercadoLivreItemBatchResponse = {
  code: number
  body: MercadoLivreItemDetail
}

type MercadoLivreItemDescription = {
  plain_text?: string | null
  text?: string | null
}

type MercadoLivreItemDetailWithDescription = MercadoLivreItemDetail & {
  description?: string | null
}

@Injectable()
export class MercadoLivreService {
  private readonly logger = new Logger(MercadoLivreService.name)
  private readonly authorizeUrl = 'https://auth.mercadolivre.com.br/authorization'
  private readonly tokenUrl = 'https://api.mercadolibre.com/oauth/token'
  private readonly profileUrl = 'https://api.mercadolibre.com/users/me'
  private readonly itemsSearchBaseUrl = 'https://api.mercadolibre.com/users'
  private readonly itemsUrl = 'https://api.mercadolibre.com/items'
  private readonly itemsBatchSize = 20
  private readonly stateTtlMs = 10 * 60 * 1000
  private readonly pendingStates = new Map<string, number>()

  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly successRedirect?: string
  private readonly errorRedirect?: string

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly marketplaceService: MarketplaceService,
    private readonly productService: ProductService,
  ) {
    this.clientId = this.configService.get<string>('ML_CLIENT_ID') ?? ''
    this.clientSecret = this.configService.get<string>('ML_CLIENT_SECRET') ?? ''
    this.redirectUri = this.configService.get<string>('ML_REDIRECT_URI') ?? ''
    this.successRedirect = this.configService.get<string>('ML_SUCCESS_REDIRECT_URL')
    this.errorRedirect = this.configService.get<string>('ML_ERROR_REDIRECT_URL')

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      this.logger.error(
        'Configurações do Mercado Livre ausentes. Verifique ML_CLIENT_ID, ML_CLIENT_SECRET e ML_REDIRECT_URI.',
      )
    }
  }

  getSuccessRedirectUrl(): string | undefined {
    return this.successRedirect
  }

  getDefaultSuccessRedirectUrl(): string {
    const baseUrl =
      this.configService.get<string>('APP_WEB_URL') ??
      this.configService.get<string>('FRONTEND_URL')

    if (baseUrl && baseUrl.trim().length > 0) {
      return `${baseUrl.replace(/\/$/, '')}/admin/preferences/marketplaces?ml_status=success`
    }

    return '/admin/preferences/marketplaces?ml_status=success'
  }

  getErrorRedirectUrl(): string | undefined {
    return this.errorRedirect
  }

  async generateAuthorizationUrl(): Promise<{ authorizationUrl: string; state: string }> {
    if (!this.clientId || !this.redirectUri) {
      throw new InternalServerErrorException(
        'Configuração do Mercado Livre não encontrada. Verifique variáveis de ambiente.',
      )
    }

    this.cleanupStates()
    const state = this.generateState()
    const queryParams = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
    })

    const authorizationUrl = `${this.authorizeUrl}?${queryParams.toString()}`
    return { authorizationUrl, state }
  }

  async handleCallback(code?: string, state?: string): Promise<MarketplaceAccount> {
    if (!code) {
      throw new BadRequestException('Código de autorização ausente')
    }

    if (!state || !this.consumeState(state)) {
      throw new BadRequestException('Estado inválido ou expirado')
    }

    const tokenData = await this.exchangeCodeForToken(code)
    const profile = await this.fetchProfile(tokenData.access_token)

    const expiresAt =
      typeof tokenData.expires_in === 'number'
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

    return this.marketplaceService.upsertAccount('mercado_livre', String(tokenData.user_id), {
      accountName: profile.nickname ?? profile.first_name ?? null,
      scopes: tokenData.scope ?? null,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      accountData: {
        id: profile.id,
        nickname: profile.nickname,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        country_id: profile.country_id,
        permalink: profile.permalink,
        site_id: profile.site_id,
        status: profile.status,
      },
    })
  }

  async listAccountProducts(accountId: number) {
    const account = await this.getMercadoLivreAccount(accountId)
    const searchUrl = `${this.itemsSearchBaseUrl}/${encodeURIComponent(
      account.externalUserId,
    )}/items/search`

    let itemIds: string[] = []
    const limit = 50 // Máximo permitido pela API do Mercado Livre
    let offset = 0
    let hasMore = true

    try {
      while (hasMore) {
        const response = await lastValueFrom<
          AxiosResponse<MercadoLivreItemsSearchResponse>
        >(
          this.httpService.get<MercadoLivreItemsSearchResponse>(searchUrl, {
            params: {
              limit,
              offset,
              status: 'active',
            },
            headers: this.buildAuthHeaders(account),
          }),
        )

        const results = Array.isArray(response.data?.results)
          ? response.data.results
          : []

        itemIds = [...itemIds, ...results]

        // Verifica se há mais resultados para buscar
        const total = response.data?.paging?.total
        if (total !== undefined && itemIds.length >= total) {
          hasMore = false
        } else if (results.length < limit) {
          // Se retornou menos que o limite, não há mais resultados
          hasMore = false
        } else {
          // Continua buscando na próxima página
          offset += limit
        }
      }
    } catch (error) {
      this.logger.error('Erro ao buscar itens do Mercado Livre', error)
      throw new InternalServerErrorException(
        'Não foi possível recuperar os produtos do Mercado Livre',
      )
    }

    if (itemIds.length === 0) {
      return {
        accountId: account.id,
        provider: account.provider,
        accountName: account.accountName,
        fetchedAt: new Date().toISOString(),
        products: [],
      }
    }

    const details = await this.fetchItemsDetails(account, itemIds)

    const products = details.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency_id,
      availableQuantity: item.available_quantity,
      permalink: item.permalink,
      thumbnail:
        item.secure_thumbnail ??
        item.thumbnail ??
        item.pictures?.[0]?.secure_url ??
        item.pictures?.[0]?.url ??
        null,
      status: item.status,
      lastUpdated: item.last_updated ?? null,
    }))

    return {
      accountId: account.id,
      provider: account.provider,
      accountName: account.accountName,
      fetchedAt: new Date().toISOString(),
      products,
    }
  }

  async importProductsFromAccount(
    accountId: number,
    payload: ImportMercadoLivreProductsDto,
  ) {
    if (!payload.productIds || payload.productIds.length === 0) {
      throw new BadRequestException(
        'Nenhum produto selecionado para importação',
      )
    }

    const account = await this.getMercadoLivreAccount(accountId)
    const uniqueProductIds = Array.from(new Set(payload.productIds))

    const details = await this.fetchItemsDetails(account, uniqueProductIds, {
      includeDescription: true,
    })
    const detailMap = new Map(details.map((item) => [item.id, item]))

    let imported = 0
    let failed = 0
    const errors: Array<{ productId: string; message: string }> = []

    for (const productId of uniqueProductIds) {
      const item = detailMap.get(productId)

      if (!item) {
        failed++
        errors.push({
          productId,
          message: 'Produto não encontrado na conta do Mercado Livre',
        })
        continue
      }

      try {
        const productPayload = mapMercadoLivreItemToCreateProduct(item, {
          categoryId: payload.categoryId,
          categoryName: payload.categoryName ?? null,
        })
        await this.productService.create(productPayload, undefined)
        imported++
      } catch (error) {
        failed++
        const message =
          error instanceof Error
            ? error.message
            : 'Falha ao importar produto do Mercado Livre'
        errors.push({ productId, message })
        this.logger.error(
          `Erro ao importar produto ${productId} do Mercado Livre`,
          error,
        )
      }
    }

    return {
      accountId: account.id,
      provider: account.provider,
      imported,
      failed,
      errors,
    }
  }

  private async fetchItemsDetails(
    account: MarketplaceAccount,
    itemIds: string[],
    options?: { includeDescription?: boolean },
  ): Promise<MercadoLivreItemDetailWithDescription[]> {
    if (!itemIds.length) {
      return []
    }

    const headers = this.buildAuthHeaders(account)
    const chunks = this.chunkArray(itemIds, this.itemsBatchSize)
    const results: MercadoLivreItemDetailWithDescription[] = []

    for (const chunk of chunks) {
      try {
        const response = await lastValueFrom<
          AxiosResponse<MercadoLivreItemBatchResponse[]>
        >(
          this.httpService.get<MercadoLivreItemBatchResponse[]>(this.itemsUrl, {
            params: { ids: chunk.join(',') },
            headers,
          }),
        )

        for (const item of response.data ?? []) {
          if (item.code !== 200 || !item.body) {
            continue
          }

          const normalizedPictures = (item.body.pictures ?? []).map(
            (picture) => {
              const normalizedUrl =
                this.normalizeImageUrl(
                  picture.secure_url ?? picture.url ?? null,
                ) ?? picture.url

              return {
                ...picture,
                url: normalizedUrl,
                secure_url: normalizedUrl,
              }
            },
          )

          const normalizedThumbnail =
            this.normalizeImageUrl(
              item.body.secure_thumbnail ??
                item.body.thumbnail ??
                normalizedPictures[0]?.secure_url ??
                normalizedPictures[0]?.url ??
                null,
            ) ??
            item.body.secure_thumbnail ??
            item.body.thumbnail ??
            null

          results.push({
            ...item.body,
            thumbnail: normalizedThumbnail,
            secure_thumbnail: normalizedThumbnail ?? undefined,
            pictures: normalizedPictures,
          })
        }
      } catch (error) {
        this.logger.error('Erro ao obter detalhes de itens do Mercado Livre', error)
        throw new InternalServerErrorException(
          'Não foi possível obter detalhes dos produtos do Mercado Livre',
        )
      }
    }

    if (options?.includeDescription) {
      await Promise.all(
        results.map(async (item) => {
          item.description = await this.fetchItemDescription(account, item.id)
        }),
      )
    }

    return results
  }

  private async fetchItemDescription(
    account: MarketplaceAccount,
    itemId: string,
  ): Promise<string | null> {
    const descriptionUrl = `${this.itemsUrl}/${encodeURIComponent(
      itemId,
    )}/description`

    try {
      const response = await lastValueFrom<
        AxiosResponse<MercadoLivreItemDescription>
      >(
        this.httpService.get<MercadoLivreItemDescription>(descriptionUrl, {
          headers: this.buildAuthHeaders(account),
        }),
      )

      return (
        response.data?.plain_text ??
        response.data?.text ??
        null
      )
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError?.response?.status !== 404) {
        this.logger.warn(`Erro ao buscar descrição para item ${itemId}`, error)
      }

      return null
    }
  }

  private async getMercadoLivreAccount(
    accountId: number,
  ): Promise<MarketplaceAccount> {
    const account = await this.marketplaceService.getAccountByIdOrFail(
      accountId,
    )

    if (account.provider !== 'mercado_livre') {
      throw new BadRequestException(
        'A importação está disponível apenas para contas do Mercado Livre',
      )
    }

    if (!account.accessToken) {
      throw new BadRequestException(
        'Conta do Mercado Livre sem token de acesso válido',
      )
    }

    return account
  }

  private buildAuthHeaders(account: MarketplaceAccount) {
    if (!account.accessToken) {
      throw new BadRequestException(
        'Token de acesso do Mercado Livre não encontrado',
      )
    }

    return {
      Authorization: `Bearer ${account.accessToken}`,
    }
  }

  private normalizeImageUrl(url?: string | null): string | null {
    if (!url) {
      return null
    }

    if (url.startsWith('http://')) {
      return `https://${url.slice(7)}`
    }

    if (url.startsWith('//')) {
      return `https:${url}`
    }

    return url
  }

  private chunkArray<T>(values: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size))
    }
    return chunks
  }

  private async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new InternalServerErrorException(
        'Configuração do Mercado Livre não encontrada. Verifique variáveis de ambiente.',
      )
    }

    const payload = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
    })

    try {
      const response = await lastValueFrom<AxiosResponse<TokenResponse>>(
        this.httpService.post<TokenResponse>(this.tokenUrl, payload.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      )

      return response.data
    } catch (error) {
      this.logger.error('Erro ao trocar código por token do Mercado Livre', error)
      throw new InternalServerErrorException(
        'Não foi possível completar a autenticação com o Mercado Livre',
      )
    }
  }

  private async fetchProfile(accessToken: string): Promise<MercadoLivreProfile> {
    try {
      const response = await lastValueFrom<AxiosResponse<MercadoLivreProfile>>(
        this.httpService.get<MercadoLivreProfile>(this.profileUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      )

      return response.data
    } catch (error) {
      this.logger.error('Erro ao buscar perfil do Mercado Livre', error)
      throw new InternalServerErrorException(
        'Não foi possível obter dados da conta do Mercado Livre',
      )
    }
  }

  private generateState(): string {
    const state = randomBytes(16).toString('hex')
    this.pendingStates.set(state, Date.now() + this.stateTtlMs)
    return state
  }

  private consumeState(state: string): boolean {
    const expiresAt = this.pendingStates.get(state)
    if (!expiresAt || expiresAt < Date.now()) {
      this.pendingStates.delete(state)
      return false
    }

    this.pendingStates.delete(state)
    return true
  }

  private cleanupStates() {
    const now = Date.now()
    for (const [state, expiresAt] of this.pendingStates.entries()) {
      if (expiresAt < now) {
        this.pendingStates.delete(state)
      }
    }
  }
}

