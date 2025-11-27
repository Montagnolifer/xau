import { Controller, Post, Body, UploadedFiles, UseInterceptors, Get, Delete, Param, Put, BadRequestException, UseGuards, Req, Res, UploadedFile, Query } from '@nestjs/common'
import { ProductService } from './product.service'
import { CreateProductDto } from './dto/create-product.dto'
import { Product } from './entities/product.entity'
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express'
import * as multer from 'multer'
import { extname } from 'path'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request, Response } from 'express'
import { XlsxParserService } from './xlsx-parser.service'

function generateUniqueFilename(originalname: string) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  return `${uniqueSuffix}${extname(originalname || '')}`
}

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly xlsxParserService: XlsxParserService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
    ], {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens são permitidas'), false)
        }
        cb(null, true)
      },
    })
  )
  async create(
    @Req() req: Request,
    @Body() createProductDto: any,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ): Promise<Product> {
    // Usar os dados do request body diretamente
    createProductDto = req.body;
    
    // Validações básicas
    if (!createProductDto.name) {
      throw new BadRequestException('Nome do produto é obrigatório');
    }
    
    const rawCategoryId = createProductDto.categoryId ?? createProductDto.category_id;
    if (rawCategoryId === undefined || rawCategoryId === null || rawCategoryId === '') {
      throw new BadRequestException('Categoria é obrigatória');
    }
    const parsedCategoryId = Number(rawCategoryId);
    if (Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      throw new BadRequestException('Categoria selecionada é inválida');
    }
    createProductDto.categoryId = parsedCategoryId;
    if (typeof createProductDto.category === 'string') {
      createProductDto.category = createProductDto.category.trim();
    }
    
    // Processar arrays (variations legacy, variationAxes e variantItems)
    if (files?.images?.length) {
      files.images.forEach((file) => {
        file.filename = generateUniqueFilename(file.originalname)
      })
    }

    const parseMaybeJson = (value: any) => {
      if (typeof value !== 'string') return value
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    }
    createProductDto.variations = parseMaybeJson(createProductDto.variations) ?? createProductDto.variations ?? []
    createProductDto.variationAxes = parseMaybeJson(createProductDto.variationAxes) ?? createProductDto.variationAxes ?? createProductDto.variations ?? []
    createProductDto.variantItems = parseMaybeJson(createProductDto.variantItems) ?? createProductDto.variantItems ?? []
    
    // Converter campos numéricos
    if (createProductDto.price !== undefined && createProductDto.price !== '') {
      createProductDto.price = Number(createProductDto.price);
      if (isNaN(createProductDto.price) || createProductDto.price < 0) {
        throw new BadRequestException('Preço deve ser um número válido maior ou igual a zero');
      }
    }
    
    if (createProductDto.wholesalePrice !== undefined && createProductDto.wholesalePrice !== '') {
      createProductDto.wholesalePrice = Number(createProductDto.wholesalePrice);
      if (isNaN(createProductDto.wholesalePrice) || createProductDto.wholesalePrice < 0) {
        throw new BadRequestException('Preço de atacado deve ser um número válido maior ou igual a zero');
      }
    } else {
      createProductDto.wholesalePrice = undefined;
    }
    
    if (createProductDto.priceUSD !== undefined && createProductDto.priceUSD !== '') {
      createProductDto.priceUSD = Number(createProductDto.priceUSD);
      if (isNaN(createProductDto.priceUSD) || createProductDto.priceUSD < 0) {
        throw new BadRequestException('Preço em dólar deve ser um número válido maior ou igual a zero');
      }
    } else {
      createProductDto.priceUSD = undefined;
    }
    
    if (createProductDto.wholesalePriceUSD !== undefined && createProductDto.wholesalePriceUSD !== '') {
      createProductDto.wholesalePriceUSD = Number(createProductDto.wholesalePriceUSD);
      if (isNaN(createProductDto.wholesalePriceUSD) || createProductDto.wholesalePriceUSD < 0) {
        throw new BadRequestException('Preço de atacado em dólar deve ser um número válido maior ou igual a zero');
      }
    } else {
      createProductDto.wholesalePriceUSD = undefined;
    }
    
    if (createProductDto.stock !== undefined && createProductDto.stock !== '') {
      createProductDto.stock = Number(createProductDto.stock);
      if (isNaN(createProductDto.stock) || createProductDto.stock < 0) {
        throw new BadRequestException('Estoque deve ser um número válido maior ou igual a zero');
      }
    }

    // Validação condicional de variantItems
    const hasVariantItems = Array.isArray(createProductDto.variantItems) && createProductDto.variantItems.length > 0
    if (hasVariantItems) {
      for (const it of createProductDto.variantItems) {
        if (it.price === undefined || it.price === null || isNaN(Number(it.price)) || Number(it.price) < 0) {
          throw new BadRequestException('Cada combinação deve ter preço válido >= 0')
        }
        if (it.stock === undefined || it.stock === null || isNaN(Number(it.stock)) || Number(it.stock) < 0) {
          throw new BadRequestException('Cada combinação deve ter estoque válido >= 0')
        }
        it.price = Number(it.price)
        it.stock = Number(it.stock)
        if (it.wholesalePrice !== undefined && it.wholesalePrice !== '') it.wholesalePrice = Number(it.wholesalePrice)
        else it.wholesalePrice = undefined
        if (it.priceUSD !== undefined && it.priceUSD !== '') it.priceUSD = Number(it.priceUSD)
        else it.priceUSD = undefined
        if (it.wholesalePriceUSD !== undefined && it.wholesalePriceUSD !== '') it.wholesalePriceUSD = Number(it.wholesalePriceUSD)
        else it.wholesalePriceUSD = undefined
      }
    } else {
      if (createProductDto.price === undefined) {
        throw new BadRequestException('Preço é obrigatório quando não há variações por combinação');
      }
      if (createProductDto.stock === undefined) {
        throw new BadRequestException('Estoque é obrigatório quando não há variações por combinação');
      }
    }
    
    if (createProductDto.weight !== undefined && createProductDto.weight !== '') {
      createProductDto.weight = Number(createProductDto.weight);
      if (isNaN(createProductDto.weight) || createProductDto.weight < 0) {
        throw new BadRequestException('Peso deve ser um número válido maior ou igual a zero');
      }
    } else {
      createProductDto.weight = undefined;
    }

    // Normalizar link de pagamento
    if (typeof createProductDto.paymentLink === 'string') {
      createProductDto.paymentLink = createProductDto.paymentLink.trim();
      if (createProductDto.paymentLink === '') {
        createProductDto.paymentLink = undefined;
      }
    }
    
    // Converter status
    if (createProductDto.status !== undefined) {
      createProductDto.status = createProductDto.status === 'true' || createProductDto.status === true;
    }
    
    return this.productService.create(createProductDto, files?.images)
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Se não houver parâmetros de paginação, retornar todos os produtos (compatibilidade)
    if (!page && !limit) {
      return this.productService.findAll();
    }

    // Converter para números com valores padrão
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 30;

    // Validar valores
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('Parâmetro page deve ser um número maior que 0');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new BadRequestException('Parâmetro limit deve ser um número maior que 0');
    }

    return this.productService.findAllPaginated(pageNum, limitNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
    ], {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens são permitidas'), false)
        }
        cb(null, true)
      },
    })
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: any,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ): Promise<Product> {
    // Validações básicas
    if (!updateProductDto.name) {
      throw new BadRequestException('Nome do produto é obrigatório');
    }
    
    const rawCategoryId = updateProductDto.categoryId ?? updateProductDto.category_id;
    if (rawCategoryId === undefined || rawCategoryId === null || rawCategoryId === '') {
      throw new BadRequestException('Categoria é obrigatória');
    }
    const parsedCategoryId = Number(rawCategoryId);
    if (Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      throw new BadRequestException('Categoria selecionada é inválida');
    }
    updateProductDto.categoryId = parsedCategoryId;
    if (typeof updateProductDto.category === 'string') {
      updateProductDto.category = updateProductDto.category.trim();
    }
    
    // Processar arrays (variations legacy, variationAxes e variantItems)
    if (files?.images?.length) {
      files.images.forEach((file) => {
        file.filename = generateUniqueFilename(file.originalname)
      })
    }

    const parseMaybeJsonU = (value: any) => {
      if (typeof value !== 'string') return value
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    }
    updateProductDto.variations = parseMaybeJsonU(updateProductDto.variations) ?? updateProductDto.variations ?? []
    updateProductDto.variationAxes = parseMaybeJsonU(updateProductDto.variationAxes) ?? updateProductDto.variationAxes ?? updateProductDto.variations ?? []
    updateProductDto.variantItems = parseMaybeJsonU(updateProductDto.variantItems) ?? updateProductDto.variantItems ?? []
    
    // Converter campos numéricos
    if (updateProductDto.price !== undefined && updateProductDto.price !== '') {
      updateProductDto.price = Number(updateProductDto.price);
      if (isNaN(updateProductDto.price) || updateProductDto.price < 0) {
        throw new BadRequestException('Preço deve ser um número válido maior ou igual a zero');
      }
    }
    
    if (updateProductDto.wholesalePrice !== undefined && updateProductDto.wholesalePrice !== '') {
      updateProductDto.wholesalePrice = Number(updateProductDto.wholesalePrice);
      if (isNaN(updateProductDto.wholesalePrice) || updateProductDto.wholesalePrice < 0) {
        throw new BadRequestException('Preço de atacado deve ser um número válido maior ou igual a zero');
      }
    } else {
      updateProductDto.wholesalePrice = undefined;
    }
    
    if (updateProductDto.priceUSD !== undefined && updateProductDto.priceUSD !== '') {
      updateProductDto.priceUSD = Number(updateProductDto.priceUSD);
      if (isNaN(updateProductDto.priceUSD) || updateProductDto.priceUSD < 0) {
        throw new BadRequestException('Preço em dólar deve ser um número válido maior ou igual a zero');
      }
    } else {
      updateProductDto.priceUSD = undefined;
    }
    
    if (updateProductDto.wholesalePriceUSD !== undefined && updateProductDto.wholesalePriceUSD !== '') {
      updateProductDto.wholesalePriceUSD = Number(updateProductDto.wholesalePriceUSD);
      if (isNaN(updateProductDto.wholesalePriceUSD) || updateProductDto.wholesalePriceUSD < 0) {
        throw new BadRequestException('Preço de atacado em dólar deve ser um número válido maior ou igual a zero');
      }
    } else {
      updateProductDto.wholesalePriceUSD = undefined;
    }
    
    if (updateProductDto.stock !== undefined && updateProductDto.stock !== '') {
      updateProductDto.stock = Number(updateProductDto.stock);
      if (isNaN(updateProductDto.stock) || updateProductDto.stock < 0) {
        throw new BadRequestException('Estoque deve ser um número válido maior ou igual a zero');
      }
    }

    const hasVariantItemsU = Array.isArray(updateProductDto.variantItems) && updateProductDto.variantItems.length > 0
    if (hasVariantItemsU) {
      for (const it of updateProductDto.variantItems) {
        if (it.price === undefined || it.price === null || isNaN(Number(it.price)) || Number(it.price) < 0) {
          throw new BadRequestException('Cada combinação deve ter preço válido >= 0')
        }
        if (it.stock === undefined || it.stock === null || isNaN(Number(it.stock)) || Number(it.stock) < 0) {
          throw new BadRequestException('Cada combinação deve ter estoque válido >= 0')
        }
        it.price = Number(it.price)
        it.stock = Number(it.stock)
        if (it.wholesalePrice !== undefined && it.wholesalePrice !== '') it.wholesalePrice = Number(it.wholesalePrice)
        else it.wholesalePrice = undefined
        if (it.priceUSD !== undefined && it.priceUSD !== '') it.priceUSD = Number(it.priceUSD)
        else it.priceUSD = undefined
        if (it.wholesalePriceUSD !== undefined && it.wholesalePriceUSD !== '') it.wholesalePriceUSD = Number(it.wholesalePriceUSD)
        else it.wholesalePriceUSD = undefined
      }
    } else {
      if (updateProductDto.price === undefined) {
        throw new BadRequestException('Preço é obrigatório quando não há variações por combinação');
      }
      if (updateProductDto.stock === undefined) {
        throw new BadRequestException('Estoque é obrigatório quando não há variações por combinação');
      }
    }
    
    if (updateProductDto.weight !== undefined && updateProductDto.weight !== '') {
      updateProductDto.weight = Number(updateProductDto.weight);
      if (isNaN(updateProductDto.weight) || updateProductDto.weight < 0) {
        throw new BadRequestException('Peso deve ser um número válido maior ou igual a zero');
      }
    } else {
      updateProductDto.weight = undefined;
    }

    // Normalizar link de pagamento
    if (typeof updateProductDto.paymentLink === 'string') {
      updateProductDto.paymentLink = updateProductDto.paymentLink.trim();
      if (updateProductDto.paymentLink === '') {
        updateProductDto.paymentLink = undefined;
      }
    }
    
    // Converter status
    if (updateProductDto.status !== undefined) {
      updateProductDto.status = updateProductDto.status === 'true' || updateProductDto.status === true;
    }

    return this.productService.update(+id, updateProductDto, files?.images)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    const result = await this.productService.remove(+id);
    return result;
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async toggleFavorite(@Param('id') id: string) {
    return this.productService.toggleFavorite(+id);
  }

  @Get('favorites/list')
  async getFavorites() {
    return this.productService.getFavorites();
  }

  @Get('import-template')
  async downloadTemplate(@Res() res: Response) {
    try {
      const templateBuffer = this.xlsxParserService.generateTemplate()
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename=template-importacao-produtos.xlsx')
      res.send(templateBuffer)
    } catch (error) {
      throw new BadRequestException('Erro ao gerar template: ' + (error?.message || 'Erro desconhecido'))
    }
  }

  @Post('import-xlsx')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ]
        const allowedExtensions = ['.xlsx', '.xls']
        const ext = extname(file.originalname).toLowerCase()

        if (
          allowedMimes.includes(file.mimetype) ||
          allowedExtensions.includes(ext)
        ) {
          cb(null, true)
        } else {
          cb(new BadRequestException('Apenas arquivos Excel (.xlsx, .xls) são permitidos'), false)
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    })
  )
  async importFromXlsx(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido')
    }

    try {
      const products = this.xlsxParserService.parseFile(file.buffer)
      
      if (products.length === 0) {
        throw new BadRequestException('Nenhum produto válido encontrado no arquivo')
      }

      const items = products.map((product, index) => ({
        payload: product,
        reference: `Linha ${index + 1}: ${product.name}`,
      }))

      const results = await this.productService.importMany(items)

      const successCount = results.filter((r) => r.success).length
      const errorCount = results.filter((r) => !r.success).length

      return {
        total: results.length,
        success: successCount,
        failed: errorCount,
        results: results.map((r) => ({
          reference: r.reference,
          success: r.success,
          productId: r.product?.id,
          error: r.error,
        })),
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Erro ao importar produtos: ' + (error?.message || 'Erro desconhecido'))
    }
  }
} 