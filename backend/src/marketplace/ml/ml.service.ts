import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { AxiosResponse } from 'axios'
import { lastValueFrom } from 'rxjs'
import { randomBytes } from 'crypto'
import { MarketplaceService } from '../marketplace.service'
import { MarketplaceAccount } from '../entities/marketplace-account.entity'

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

@Injectable()
export class MercadoLivreService {
  private readonly logger = new Logger(MercadoLivreService.name)
  private readonly authorizeUrl = 'https://auth.mercadolivre.com.br/authorization'
  private readonly tokenUrl = 'https://api.mercadolibre.com/oauth/token'
  private readonly profileUrl = 'https://api.mercadolibre.com/users/me'
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

