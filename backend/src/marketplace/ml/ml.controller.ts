import { Controller, Get, Post, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { MercadoLivreService } from './ml.service'

@Controller('marketplace/ml')
export class MercadoLivreController {
  constructor(private readonly mercadoLivreService: MercadoLivreService) {}

  @Post('authorize')
  async authorize() {
    return this.mercadoLivreService.generateAuthorizationUrl()
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ) {
    try {
      await this.mercadoLivreService.handleCallback(code, state)
      const redirectUrl =
        this.mercadoLivreService.getSuccessRedirectUrl() ??
        this.mercadoLivreService.getDefaultSuccessRedirectUrl()

      return res.redirect(302, redirectUrl)
    } catch (error) {
      const redirectUrl = this.mercadoLivreService.getErrorRedirectUrl()
      if (redirectUrl) {
        return res.redirect(302, redirectUrl)
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a autenticação com o Mercado Livre.'

      return res
        .status(400)
        .send(
          `<html><body><p>Falha na autenticação com o Mercado Livre: ${message}</p></body></html>`,
        )
    }
  }
}

