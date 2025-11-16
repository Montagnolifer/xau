import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Product } from './entities/product.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { ProductVariation } from './entities/product-variation.entity'
import { ProductVariantItem } from './entities/product-variant-item.entity'
import { UploadsService } from '../uploads/uploads.service'
import { extname } from 'path'
import { Category } from '../category/entities/category.entity'

const PRODUCT_UPLOAD_OPTIONS = {
  resize: { width: 800, height: 800 },
  quality: 90,
  createThumbnail: false,
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private readonly variationRepository: Repository<ProductVariation>,
    @InjectRepository(ProductVariantItem)
    private readonly variantItemRepository: Repository<ProductVariantItem>,
    private readonly uploadsService: UploadsService,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  private ensureFilename(file: Express.Multer.File): Express.Multer.File {
    if (!file.filename) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const extension = file.originalname ? extname(file.originalname) : ''
      file.filename = `${uniqueSuffix}${extension}`
    }
    return file
  }

  private async uploadProductImages(images?: Array<Express.Multer.File>): Promise<string[]> {
    if (!images || images.length === 0) {
      return []
    }

    const urls: string[] = []

    for (const image of images) {
      const ensuredFile = this.ensureFilename(image)
      const result = await this.uploadsService.processImage(
        ensuredFile,
        'products',
        PRODUCT_UPLOAD_OPTIONS,
      )
      urls.push(result.url)
    }

    return urls
  }

  private normalizeImagesInput(value: any): string[] {
    if (!value) {
      return []
    }

    let parsedValue = value

    if (typeof parsedValue === 'string') {
      try {
        parsedValue = JSON.parse(parsedValue)
      } catch {
        parsedValue = parsedValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    }

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .map((item: any) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object' && typeof item.url === 'string') {
          return item.url
        }

        return null
      })
      .filter((url): url is string => Boolean(url))
  }

  private extractR2Location(url: string): { folder: string; filename: string } | null {
    try {
      const parsedUrl = new URL(url)
      const segments = parsedUrl.pathname.split('/').filter(Boolean)

      if (segments.length < 2) {
        return null
      }

      const filename = segments.pop() as string
      const folder = segments.pop() as string

      return { folder, filename }
    } catch (error) {
      this.logger.warn(`Não foi possível extrair caminho da URL: ${url}`)
      return null
    }
  }

  private async deleteImagesFromR2(urls: string[]): Promise<void> {
    for (const url of urls) {
      const location = this.extractR2Location(url)
      if (!location) {
        continue
      }

      try {
        await this.uploadsService.deleteFile(location.folder, location.filename)
      } catch (error) {
        this.logger.error(`Erro ao deletar imagem do R2 (${url}): ${error?.message || error}`)
      }
    }
  }

  async create(createProductDto: CreateProductDto, images?: Array<Express.Multer.File>): Promise<Product> {
    const { variations, variationAxes, variantItems, images: dtoImages, categoryId, ...productData } = createProductDto
    const product = this.productRepository.create(productData)

    if (categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({ where: { id: categoryId } })
      if (!category) {
        throw new NotFoundException('Categoria não encontrada')
      }
      product.categoryEntity = category
      const providedCategoryName =
        typeof productData.category === 'string' && productData.category.trim().length > 0
          ? productData.category.trim()
          : undefined
      product.category = providedCategoryName ?? category.name
    }

    const axes = (variationAxes && variationAxes.length > 0) ? variationAxes : (variations || [])

    if (axes && axes.length > 0) {
      product.variations = axes.map((variation) =>
        this.variationRepository.create(variation),
      )
    }

    const existingImages = this.normalizeImagesInput(dtoImages)
    const uploadedImages = await this.uploadProductImages(images)

    product.images = Array.from(new Set([...existingImages, ...uploadedImages]))

    // Salvar para obter ID
    const savedProduct = await this.productRepository.save(product)

    // Salvar variant items, se houver
    if (variantItems && Array.isArray(variantItems) && variantItems.length > 0) {
      const items = variantItems.map((it) =>
        this.variantItemRepository.create({
          product: savedProduct,
          options: it.options,
          sku: it.sku ?? null,
          price: it.price as unknown as number,
          wholesalePrice: (it.wholesalePrice as unknown as number) ?? null,
          priceUSD: (it.priceUSD as unknown as number) ?? null,
          wholesalePriceUSD: (it.wholesalePriceUSD as unknown as number) ?? null,
          stock: it.stock as unknown as number,
        }),
      )
      await this.variantItemRepository.save(items)

      // Agregar price/stock
      const minPrice = Math.min(...items.map(i => Number(i.price)))
      const totalStock = items.reduce((acc, i) => acc + Number(i.stock || 0), 0)
      await this.productRepository.update(savedProduct.id, {
        price: minPrice,
        stock: totalStock,
      })
    }

    return this.findOne(savedProduct.id)
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['variations', 'variantItems', 'categoryEntity'],
      order: { id: 'DESC' },
    })
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations', 'variantItems', 'categoryEntity'],
    })

    if (!product) {
      throw new Error('Produto não encontrado')
    }

    return product
  }

  async update(id: number, updateProductDto: any, images?: Array<Express.Multer.File>): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations', 'variantItems', 'categoryEntity'],
    })

    if (!product) {
      throw new Error('Produto não encontrado')
    }

    Object.assign(product, {
      name: updateProductDto.name,
      description: updateProductDto.description,
      price: updateProductDto.price,
      wholesalePrice: updateProductDto.wholesalePrice,
      priceUSD: updateProductDto.priceUSD,
      wholesalePriceUSD: updateProductDto.wholesalePriceUSD,
      stock: updateProductDto.stock,
      status: updateProductDto.status,
      sku: updateProductDto.sku,
      weight: updateProductDto.weight,
      dimensions: updateProductDto.dimensions,
      youtubeUrl: updateProductDto.youtubeUrl,
    })

    if (updateProductDto.categoryId !== undefined) {
      if (
        updateProductDto.categoryId === null ||
        updateProductDto.categoryId === '' ||
        Number.isNaN(Number(updateProductDto.categoryId))
      ) {
        product.categoryEntity = null
        product.category = null
      } else {
        const categoryId = Number(updateProductDto.categoryId)
        const category = await this.categoryRepository.findOne({ where: { id: categoryId } })
        if (!category) {
          throw new NotFoundException('Categoria não encontrada')
        }
        product.categoryEntity = category
        const providedCategoryName =
          typeof updateProductDto.category === 'string' && updateProductDto.category.trim().length > 0
            ? updateProductDto.category.trim()
            : undefined
        product.category = providedCategoryName ?? category.name
      }
    } else if (updateProductDto.category !== undefined) {
      product.category =
        typeof updateProductDto.category === 'string' && updateProductDto.category.trim().length > 0
          ? updateProductDto.category.trim()
          : null
    }

    const axes = (updateProductDto.variationAxes && updateProductDto.variationAxes.length > 0)
      ? updateProductDto.variationAxes
      : (updateProductDto.variations || [])

    if (axes && axes.length > 0) {
      if (product.variations) {
        await this.variationRepository.remove(product.variations)
      }

      product.variations = axes.map((variation: any) =>
        this.variationRepository.create(variation),
      )
    }

    const hasExistingImagesPayload =
      updateProductDto.existingImages !== undefined || updateProductDto.images !== undefined

    const keepImages = hasExistingImagesPayload
      ? this.normalizeImagesInput(updateProductDto.existingImages ?? updateProductDto.images)
      : []

    const currentImages = product.images || []
    const imagesToRemove = currentImages.filter((url) => !keepImages.includes(url))

    if (imagesToRemove.length > 0) {
      await this.deleteImagesFromR2(imagesToRemove)
    }

    product.images = keepImages

    if (images && images.length > 0) {
      const uploadedImages = await this.uploadProductImages(images)
      product.images = Array.from(new Set([...(product.images || []), ...uploadedImages]))
    }

    // Sincronizar variant items
    if (Array.isArray(updateProductDto.variantItems)) {
      // remover atuais
      if (product.variantItems && product.variantItems.length > 0) {
        await this.variantItemRepository.remove(product.variantItems)
      }
      const items = updateProductDto.variantItems.map((it: any) =>
        this.variantItemRepository.create({
          product,
          options: it.options,
          sku: it.sku ?? null,
          price: it.price,
          wholesalePrice: it.wholesalePrice ?? null,
          priceUSD: it.priceUSD ?? null,
          wholesalePriceUSD: it.wholesalePriceUSD ?? null,
          stock: it.stock,
        }),
      )
      await this.variantItemRepository.save(items)

      // Agregar price/stock
      const minPrice = Math.min(...items.map(i => Number(i.price)))
      const totalStock = items.reduce((acc, i) => acc + Number(i.stock || 0), 0)
      product.price = minPrice
      product.stock = totalStock
    }

    const savedProduct = await this.productRepository.save(product)
    return this.findOne(savedProduct.id)
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations', 'variantItems', 'categoryEntity'],
    })

    if (!product) {
      throw new Error('Produto não encontrado')
    }

    await this.deleteImagesFromR2(product.images || [])

    await this.productRepository.remove(product)

    return { message: 'Produto deletado com sucesso' }
  }

  async importMany(
    items: Array<{ payload: CreateProductDto; reference?: string }>,
  ) {
    const results: Array<{
      reference?: string
      success: boolean
      product?: Product
      error?: string
    }> = []

    for (const item of items) {
      try {
        const product = await this.create(item.payload, undefined)
        results.push({
          reference: item.reference,
          success: true,
          product,
        })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Falha ao importar produto'
        this.logger.error(
          `Erro ao importar produto (referência: ${item.reference ?? 'sem referência'})`,
          error,
        )
        results.push({
          reference: item.reference,
          success: false,
          error: message,
        })
      }
    }

    return results
  }

  async toggleFavorite(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations'],
    })

    if (!product) {
      throw new Error('Produto não encontrado')
    }

    product.isFavorite = !product.isFavorite
    return this.productRepository.save(product)
  }

  async getFavorites(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isFavorite: true },
      relations: ['variations', 'categoryEntity'],
      order: { id: 'DESC' },
    })
  }

  async findByMercadoLivreId(mercadoLivreId: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { mercadoLivreId },
      relations: ['variations', 'categoryEntity'],
    })
  }
}