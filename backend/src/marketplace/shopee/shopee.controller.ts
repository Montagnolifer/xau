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
    @Res() res: Response,
  ) {
    try {
      await this.shopeeService.handleCallback(code, shopId, state)
      const redirectUrl =
        this.shopeeService.getSuccessRedirectUrl() ??
        this.shopeeService.getDefaultSuccessRedirectUrl()

      return res.redirect(302, redirectUrl)
    } catch (error) {
      const redirectUrl = this.shopeeService.getErrorRedirectUrl()
      if (redirectUrl) {
        return res.redirect(302, redirectUrl)
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a autenticação com a Shopee.'

      return res
        .status(400)
        .send(
          `<html><body><p>Falha na autenticação com a Shopee: ${message}</p></body></html>`,
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
