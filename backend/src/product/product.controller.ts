import { Controller, Post, Body, UploadedFiles, UseInterceptors, Get, Delete, Param, Put, BadRequestException, UseGuards, Req } from '@nestjs/common'
import { ProductService } from './product.service'
import { CreateProductDto } from './dto/create-product.dto'
import { Product } from './entities/product.entity'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import * as multer from 'multer'
import { extname } from 'path'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request } from 'express'

function generateUniqueFilename(originalname: string) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  return `${uniqueSuffix}${extname(originalname || '')}`
}

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
    
    if (!createProductDto.category) {
      throw new BadRequestException('Categoria é obrigatória');
    }
    
    // Processar variações se for string
    if (files?.images?.length) {
      files.images.forEach((file) => {
        file.filename = generateUniqueFilename(file.originalname)
      })
    }

    if (createProductDto.variations && typeof createProductDto.variations === 'string') {
      try {
        createProductDto.variations = JSON.parse(createProductDto.variations);
      } catch (e) {
        createProductDto.variations = [];
      }
    }
    
    // Converter campos numéricos
    if (createProductDto.price !== undefined) {
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
    
    if (createProductDto.stock !== undefined) {
      createProductDto.stock = Number(createProductDto.stock);
      if (isNaN(createProductDto.stock) || createProductDto.stock < 0) {
        throw new BadRequestException('Estoque deve ser um número válido maior ou igual a zero');
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
    
    // Converter status
    if (createProductDto.status !== undefined) {
      createProductDto.status = createProductDto.status === 'true' || createProductDto.status === true;
    }
    
    return this.productService.create(createProductDto, files?.images)
  }

  @Get()
  async findAll() {
    return this.productService.findAll();
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
    
    if (!updateProductDto.category) {
      throw new BadRequestException('Categoria é obrigatória');
    }
    
    // Processar variações se for string
    if (files?.images?.length) {
      files.images.forEach((file) => {
        file.filename = generateUniqueFilename(file.originalname)
      })
    }

    if (updateProductDto.variations && typeof updateProductDto.variations === 'string') {
      try {
        updateProductDto.variations = JSON.parse(updateProductDto.variations);
      } catch (e) {
        updateProductDto.variations = [];
      }
    }
    
    // Converter campos numéricos
    if (updateProductDto.price !== undefined) {
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
    
    if (updateProductDto.stock !== undefined) {
      updateProductDto.stock = Number(updateProductDto.stock);
      if (isNaN(updateProductDto.stock) || updateProductDto.stock < 0) {
        throw new BadRequestException('Estoque deve ser um número válido maior ou igual a zero');
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
} 