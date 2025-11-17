import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { ShopeeService } from './shopee.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ImportShopeeProductsDto } from './dto/import-shopee-products.dto'

@Controller('marketplace/shopee')
export class ShopeeController {
  constructor(private readonly shopeeService: ShopeeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('authorize')
  async authorize() {
    try {
      return await this.shopeeService.generateAuthorizationUrl()
    } catch (error) {
      console.error('Erro ao gerar URL de autorização Shopee:', error)
      throw error
    }
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('shop_id') shopId: string | undefined,
    @Query('state') state: string | undefined,
    @Res({ passthrough: false }) res: Response,
  ) {
    console.log('Shopee callback recebido:', { code: code ? 'presente' : 'ausente', shopId, state })
    
    // Desabilitar o interceptor de exceções para esta rota, garantindo HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    
    try {
      await this.shopeeService.handleCallback(code, shopId, state)
      const redirectUrl =
        this.shopeeService.getSuccessRedirectUrl() ??
        this.shopeeService.getDefaultSuccessRedirectUrl()

      console.log('Redirecionando para:', redirectUrl)
      return res.redirect(302, redirectUrl)
    } catch (error) {
      console.error('Erro no callback Shopee:', error)
      
      const redirectUrl = this.shopeeService.getErrorRedirectUrl()
      if (redirectUrl) {
        console.log('Redirecionando para URL de erro:', redirectUrl)
        return res.redirect(302, redirectUrl)
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a autenticação com a Shopee.'

      // Garantir que retorna HTML válido, ignorando o interceptor
      return res
        .status(400)
        .send(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro de Autenticação</title></head><body><h1>Falha na autenticação com a Shopee</h1><p>${message}</p><script>setTimeout(function(){window.location.href="${this.shopeeService.getDefaultSuccessRedirectUrl()}";},3000);</script></body></html>`,
        )
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('accounts/:accountId/products')
  async listAccountProducts(@Param('accountId') accountId: string) {
    return this.shopeeService.listAccountProducts(Number(accountId))
  }

  @UseGuards(JwtAuthGuard)
  @Post('accounts/:accountId/import')
  async importProducts(
    @Param('accountId') accountId: string,
    @Body() payload: ImportShopeeProductsDto,
  ) {
    return this.shopeeService.importProductsFromAccount(
      Number(accountId),
      payload,
    )
  }
}
