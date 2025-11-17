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
import { createHmac } from 'crypto'
import { MarketplaceService } from '../marketplace.service'
import { MarketplaceAccount } from '../entities/marketplace-account.entity'
import { ImportShopeeProductsDto } from './dto/import-shopee-products.dto'
import { ProductService } from '../../product/product.service'
import { mapShopeeItemToCreateProduct } from './utils/shopee-product.mapper'

type ShopeeTokenResponse = {
  access_token: string
  refresh_token: string
  expire_in: number
  token_type: string
  request_id: string
  error?: string
  message?: string
}

type ShopeeShopInfo = {
  shop_id: number
  shop_name: string
  country: string
  request_id: string
  error?: string
  message?: string
}

type ShopeeProductListResponse = {
  item: Array<{
    item_id: number
    item_sku: string
    item_name: string
    item_status: string
    update_time: number
    create_time: number
  }>
  total_count: number
  request_id: string
  error?: string
  message?: string
}

type ShopeeProductDetail = {
  item_id: number
  item_sku: string
  item_name: string
  item_status: string
  price: number
  currency: string
  stock: Array<{
    seller_stock: Array<{
      location_id: string
      stock: number
    }>
  }>
  image: {
    image_url_list: string[]
  }
  description: {
    extended_description?: {
      field_list?: Array<{
        field_type: string
        text?: string
        image_info?: {
          image_id: string
          image_url: string
        }
      }>
    }
  }
  create_time: number
  update_time: number
  request_id: string
  error?: string
  message?: string
}

type ShopeeProductDetailResponse = {
  item_list: ShopeeProductDetail[]
  request_id: string
  error?: string
  message?: string
}

@Injectable()
export class ShopeeService {
  private readonly logger = new Logger(ShopeeService.name)
  private readonly baseUrl = 'https://partner.shopeemobile.com'
  private readonly authorizeUrl = `${this.baseUrl}/api/v2/shop/auth_partner`
  private readonly tokenUrl = `${this.baseUrl}/api/v2/auth/token/get`
  private readonly shopInfoUrl = `${this.baseUrl}/api/v2/shop/get_shop_info`
  private readonly productListUrl = `${this.baseUrl}/api/v2/product/get_item_list`
  private readonly productDetailUrl = `${this.baseUrl}/api/v2/product/get_item_base_info`
  private readonly itemsBatchSize = 50
  private readonly stateTtlMs = 10 * 60 * 1000
  private readonly pendingStates = new Map<string, number>()

  private readonly partnerId: string
  private readonly partnerKey: string
  private readonly redirectUri: string
  private readonly successRedirect?: string
  private readonly errorRedirect?: string

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly marketplaceService: MarketplaceService,
    private readonly productService: ProductService,
  ) {
    // Tentar ler das variáveis de ambiente de diferentes formas
    this.partnerId = 
      this.configService.get<string>('SHOPEE_PARTNER_ID') ?? 
      process.env.SHOPEE_PARTNER_ID ?? 
      ''
    this.partnerKey = 
      this.configService.get<string>('SHOPEE_PARTNER_KEY') ?? 
      process.env.SHOPEE_PARTNER_KEY ?? 
      ''
    this.redirectUri = 
      this.configService.get<string>('SHOPEE_REDIRECT_URI') ?? 
      this.configService.get<string>('SHOPEE_REDIRECT_URL') ??
      process.env.SHOPEE_REDIRECT_URI ?? 
      process.env.SHOPEE_REDIRECT_URL ??
      ''
    this.successRedirect = 
      this.configService.get<string>('SHOPEE_SUCCESS_REDIRECT_URL') ?? 
      process.env.SHOPEE_SUCCESS_REDIRECT_URL
    this.errorRedirect = 
      this.configService.get<string>('SHOPEE_ERROR_REDIRECT_URL') ?? 
      process.env.SHOPEE_ERROR_REDIRECT_URL

    // Log detalhado para debug
    this.logger.log('Configurações Shopee carregadas:', {
      hasPartnerId: !!this.partnerId,
      hasPartnerKey: !!this.partnerKey,
      hasRedirectUri: !!this.redirectUri,
      partnerIdLength: this.partnerId.length,
      partnerKeyLength: this.partnerKey.length,
      redirectUriLength: this.redirectUri.length,
    })

    if (!this.partnerId || !this.partnerKey || !this.redirectUri) {
      this.logger.error(
        'Configurações da Shopee ausentes. Verifique SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY e SHOPEE_REDIRECT_URI.',
      )
      this.logger.error('Valores lidos:', {
        partnerId: this.partnerId || '(vazio)',
        partnerKey: this.partnerKey ? '(definido)' : '(vazio)',
        redirectUri: this.redirectUri || '(vazio)',
      })
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
      return `${baseUrl.replace(/\/$/, '')}/admin/preferences/marketplaces?shopee_status=success`
    }

    return '/admin/preferences/marketplaces?shopee_status=success'
  }

  getErrorRedirectUrl(): string | undefined {
    return this.errorRedirect
  }

  async generateAuthorizationUrl(): Promise<{ authorizationUrl: string; state: string }> {
    this.logger.log('Iniciando geração de URL de autorização Shopee')
    
    if (!this.partnerId || !this.partnerKey || !this.redirectUri) {
      this.logger.error('Configurações da Shopee ausentes:', {
        hasPartnerId: !!this.partnerId,
        hasPartnerKey: !!this.partnerKey,
        hasRedirectUri: !!this.redirectUri,
      })
      throw new InternalServerErrorException(
        'Configuração da Shopee não encontrada. Verifique variáveis de ambiente SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY e SHOPEE_REDIRECT_URI.',
      )
    }

    try {
      this.cleanupStates()
      const state = this.generateState()

      const timestamp = Math.floor(Date.now() / 1000)
      const redirect = this.redirectUri

      // Log da URL de redirect sendo usada
      this.logger.log('Gerando URL de autorização com redirect:', redirect)

      // Shopee requer assinatura HMAC para autorização
      const baseString = `${this.partnerId}${redirect}${timestamp}`
      const sign = createHmac('sha256', this.partnerKey)
        .update(baseString)
        .digest('hex')

      const queryParams = new URLSearchParams({
        partner_id: this.partnerId,
        redirect: redirect,
        timestamp: String(timestamp),
        sign: sign,
      })

      const authorizationUrl = `${this.authorizeUrl}?${queryParams.toString()}`
      
      this.logger.log('URL de autorização Shopee gerada:', authorizationUrl)
      return { authorizationUrl, state }
    } catch (error) {
      this.logger.error('Erro ao gerar URL de autorização Shopee:', error)
      throw new InternalServerErrorException(
        `Erro ao gerar URL de autorização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    }
  }

  async handleCallback(
    code?: string,
    shopId?: string,
    state?: string,
  ): Promise<MarketplaceAccount> {
    if (!code) {
      throw new BadRequestException('Código de autorização ausente')
    }

    if (!shopId) {
      throw new BadRequestException('Shop ID ausente')
    }

    // Shopee pode não retornar state, então validamos apenas se fornecido
    if (state && !this.consumeState(state)) {
      throw new BadRequestException('Estado inválido ou expirado')
    }

    const tokenData = await this.exchangeCodeForToken(code, Number(shopId))
    const shopInfo = await this.fetchShopInfo(Number(shopId), tokenData.access_token)

    const expiresAt =
      typeof tokenData.expire_in === 'number'
        ? new Date(Date.now() + tokenData.expire_in * 1000)
        : null

    return this.marketplaceService.upsertAccount('shopee', String(shopId), {
      accountName: shopInfo.shop_name ?? null,
      scopes: null,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      accountData: {
        shop_id: shopInfo.shop_id,
        shop_name: shopInfo.shop_name,
        country: shopInfo.country,
      },
    })
  }

  private async exchangeCodeForToken(
    code: string,
    shopId: number,
  ): Promise<ShopeeTokenResponse> {
    if (!this.partnerId || !this.partnerKey) {
      throw new InternalServerErrorException(
        'Configuração da Shopee não encontrada. Verifique variáveis de ambiente.',
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const baseString = `${this.partnerId}${code}${shopId}${timestamp}`
    const sign = createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex')

    const params = {
      partner_id: Number(this.partnerId),
      code: code,
      shop_id: shopId,
      timestamp: timestamp,
    }

    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value)
          return acc
        },
        {} as Record<string, string>,
      ),
    ).toString()

    const fullUrl = `${this.tokenUrl}?${queryString}&sign=${sign}`

    try {
      const response = await lastValueFrom<AxiosResponse<ShopeeTokenResponse>>(
        this.httpService.post<ShopeeTokenResponse>(fullUrl, null, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )

      if (response.data.error) {
        this.logger.error('Erro na resposta da Shopee:', response.data)
        throw new InternalServerErrorException(
          response.data.message || 'Não foi possível obter token da Shopee',
        )
      }

      return response.data
    } catch (error) {
      this.logger.error('Erro ao trocar código por token da Shopee', error)
      const axiosError = error as AxiosError<ShopeeTokenResponse>
      if (axiosError.response?.data?.message) {
        throw new InternalServerErrorException(axiosError.response.data.message)
      }
      throw new InternalServerErrorException(
        'Não foi possível completar a autenticação com a Shopee',
      )
    }
  }

  private async fetchShopInfo(
    shopId: number,
    accessToken: string,
  ): Promise<ShopeeShopInfo> {
    const timestamp = Math.floor(Date.now() / 1000)
    const baseString = `${this.partnerId}${shopId}${timestamp}${accessToken}`
    const sign = createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex')

    const params = {
      partner_id: Number(this.partnerId),
      shop_id: shopId,
      timestamp: timestamp,
      access_token: accessToken,
    }

    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value)
          return acc
        },
        {} as Record<string, string>,
      ),
    ).toString()

    const fullUrl = `${this.shopInfoUrl}?${queryString}&sign=${sign}`

    try {
      const response = await lastValueFrom<AxiosResponse<ShopeeShopInfo>>(
        this.httpService.get<ShopeeShopInfo>(fullUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )

      if (response.data.error) {
        this.logger.error('Erro ao buscar informações da loja:', response.data)
        throw new InternalServerErrorException(
          response.data.message || 'Não foi possível obter informações da loja',
        )
      }

      return response.data
    } catch (error) {
      this.logger.error('Erro ao buscar informações da loja da Shopee', error)
      const axiosError = error as AxiosError<ShopeeShopInfo>
      if (axiosError.response?.data?.message) {
        throw new InternalServerErrorException(axiosError.response.data.message)
      }
      throw new InternalServerErrorException(
        'Não foi possível obter dados da conta da Shopee',
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

  async listAccountProducts(accountId: number) {
    const account = await this.getShopeeAccount(accountId)
    const shopId = Number(account.externalUserId)

    let allItems: Array<{
      item_id: number
      item_sku: string
      item_name: string
      item_status: string
      update_time: number
      create_time: number
    }> = []
    let offset = 0
    const pageSize = 100
    let hasMore = true

    try {
      while (hasMore) {
        const response = await this.callShopeeApi<ShopeeProductListResponse>(
          this.productListUrl,
          {
            shop_id: shopId,
            page_size: pageSize,
            page_no: Math.floor(offset / pageSize) + 1,
          },
          account,
        )

        if (response.error) {
          throw new InternalServerErrorException(
            response.message || 'Erro ao listar produtos da Shopee',
          )
        }

        const items = response.item || []
        allItems = [...allItems, ...items]

        if (items.length < pageSize || allItems.length >= (response.total_count || 0)) {
          hasMore = false
        } else {
          offset += pageSize
        }
      }
    } catch (error) {
      this.logger.error('Erro ao buscar produtos da Shopee', error)
      throw new InternalServerErrorException(
        'Não foi possível recuperar os produtos da Shopee',
      )
    }

    if (allItems.length === 0) {
      return {
        accountId: account.id,
        provider: account.provider,
        accountName: account.accountName,
        fetchedAt: new Date().toISOString(),
        products: [],
      }
    }

    const itemIds = allItems.map((item) => item.item_id)
    const details = await this.fetchItemsDetails(account, itemIds)

    const products = details.map((item) => {
      const stock = item.stock?.[0]?.seller_stock?.[0]?.stock || 0
      const images = item.image?.image_url_list || []
      const thumbnail = images[0] || null

      return {
        id: String(item.item_id),
        title: item.item_name,
        price: item.price,
        currency: item.currency || 'BRL',
        availableQuantity: stock,
        permalink: null,
        thumbnail,
        status: item.item_status,
        lastUpdated: item.update_time
          ? new Date(item.update_time * 1000).toISOString()
          : null,
      }
    })

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
    payload: ImportShopeeProductsDto,
  ) {
    if (!payload.productIds || payload.productIds.length === 0) {
      throw new BadRequestException('Nenhum produto selecionado para importação')
    }

    const account = await this.getShopeeAccount(accountId)
    const uniqueProductIds = Array.from(new Set(payload.productIds.map(Number)))

    const details = await this.fetchItemsDetails(account, uniqueProductIds, {
      includeDescription: true,
    })
    const detailMap = new Map(details.map((item) => [item.item_id, item]))

    let imported = 0
    let failed = 0
    const errors: Array<{ productId: string; message: string }> = []

    for (const productIdStr of payload.productIds) {
      const productId = Number(productIdStr)
      const item = detailMap.get(productId)

      if (!item) {
        failed++
        errors.push({
          productId: productIdStr,
          message: 'Produto não encontrado na conta da Shopee',
        })
        continue
      }

      // Verifica se o produto já foi importado anteriormente
      const existingProduct = await this.productService.findByShopeeId(
        String(productId),
      )
      if (existingProduct) {
        failed++
        errors.push({
          productId: productIdStr,
          message: 'Produto já foi importado anteriormente',
        })
        continue
      }

      try {
        const productPayload = mapShopeeItemToCreateProduct(item, {
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
            : 'Falha ao importar produto da Shopee'
        errors.push({ productId: productIdStr, message })
        this.logger.error(`Erro ao importar produto ${productIdStr} da Shopee`, error)
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
    itemIds: number[],
    options?: { includeDescription?: boolean },
  ): Promise<ShopeeProductDetail[]> {
    if (!itemIds.length) {
      return []
    }

    const shopId = Number(account.externalUserId)
    const chunks = this.chunkArray(itemIds, this.itemsBatchSize)
    const results: ShopeeProductDetail[] = []

    for (const chunk of chunks) {
      try {
        const response = await this.callShopeeApi<ShopeeProductDetailResponse>(
          this.productDetailUrl,
          {
            shop_id: shopId,
            item_id_list: chunk,
          },
          account,
        )

        if (response.error) {
          this.logger.error('Erro ao obter detalhes de produtos da Shopee', response)
          continue
        }

        if (response.item_list) {
          results.push(...response.item_list)
        }
      } catch (error) {
        this.logger.error('Erro ao obter detalhes de produtos da Shopee', error)
      }
    }

    return results
  }


  private async getShopeeAccount(accountId: number): Promise<MarketplaceAccount> {
    const account = await this.marketplaceService.getAccountByIdOrFail(accountId)

    if (account.provider !== 'shopee') {
      throw new BadRequestException(
        'A importação está disponível apenas para contas da Shopee',
      )
    }

    if (!account.accessToken) {
      throw new BadRequestException('Conta da Shopee sem token de acesso válido')
    }

    return account
  }

  private async callShopeeApi<T extends { error?: string; message?: string }>(
    url: string,
    params: Record<string, any>,
    account: MarketplaceAccount,
  ): Promise<T> {
    const shopId = Number(account.externalUserId)
    const timestamp = Math.floor(Date.now() / 1000)

    // Construir base string para assinatura
    const paramKeys = Object.keys(params).sort()
    const paramString = paramKeys
      .map((key) => `${key}${params[key]}`)
      .join('')
    const baseString = `${this.partnerId}${url}${timestamp}${account.accessToken}${paramString}`
    const sign = createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex')

    const queryParams = new URLSearchParams({
      partner_id: this.partnerId,
      shop_id: String(shopId),
      timestamp: String(timestamp),
      access_token: account.accessToken,
      sign: sign,
      ...Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (Array.isArray(value)) {
            acc[key] = JSON.stringify(value)
          } else {
            acc[key] = String(value)
          }
          return acc
        },
        {} as Record<string, string>,
      ),
    })

    const fullUrl = `${url}?${queryParams.toString()}`

    try {
      const response = await lastValueFrom<AxiosResponse<T>>(
        this.httpService.get<T>(fullUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )

      return response.data
    } catch (error) {
      this.logger.error('Erro ao chamar API da Shopee', error)
      const axiosError = error as AxiosError<T>
      throw new InternalServerErrorException(
        axiosError.response?.data?.message || 'Erro ao chamar API da Shopee',
      )
    }
  }

  private chunkArray<T>(values: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size))
    }
    return chunks
  }
}
