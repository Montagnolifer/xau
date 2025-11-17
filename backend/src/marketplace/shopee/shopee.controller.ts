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
    @Query() allQuery: Record<string, any>,
    @Res({ passthrough: false }) res: Response,
  ) {
    // Log completo de tudo que foi recebido
    const callbackData = {
      code: code ? 'presente' : 'ausente',
      shopId,
      state,
      allQueryParams: allQuery,
      timestamp: new Date().toISOString(),
      url: res.req?.url,
      headers: res.req?.headers,
    }
    
    console.log('=== SHOPEE CALLBACK RECEBIDO ===')
    console.log(JSON.stringify(callbackData, null, 2))
    console.log('================================')
    
    // Desabilitar o interceptor de exceções para esta rota, garantindo HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    
    try {
      await this.shopeeService.handleCallback(code, shopId, state)
      const redirectUrl =
        this.shopeeService.getSuccessRedirectUrl() ??
        this.shopeeService.getDefaultSuccessRedirectUrl()

      console.log('✅ Sucesso! Redirecionando para:', redirectUrl)
      return res.redirect(302, redirectUrl)
    } catch (error) {
      console.error('❌ Erro no callback Shopee:', error)
      console.error('Stack:', error instanceof Error ? error.stack : 'N/A')
      
      // Salvar erro em arquivo para debug
      const errorDetails = {
        timestamp: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
        },
        callbackData,
      }
      
      console.error('Detalhes completos do erro:', JSON.stringify(errorDetails, null, 2))
      
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
      const errorHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Erro de Autenticação Shopee</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 5px; }
    .details { background: #f5f5f5; padding: 10px; margin-top: 10px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Falha na autenticação com a Shopee</h1>
  <div class="error">
    <p><strong>Erro:</strong> ${message}</p>
  </div>
  <div class="details">
    <p><strong>Detalhes técnicos:</strong></p>
    <pre>${JSON.stringify(errorDetails, null, 2)}</pre>
  </div>
  <p>Você será redirecionado em alguns segundos...</p>
  <script>
    setTimeout(function(){
      window.location.href="${this.shopeeService.getDefaultSuccessRedirectUrl()}";
    }, 5000);
  </script>
</body>
</html>`
      
      return res
        .status(400)
        .send(errorHtml)
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
