import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Product } from './entities/product.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { ProductVariation } from './entities/product-variation.entity'
import { ProductImage } from './entities/product-image.entity'
import { unlink, copyFile } from 'fs/promises'
import { join } from 'path'

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private readonly variationRepository: Repository<ProductVariation>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {}

  private async copyImageToDist(filename: string): Promise<void> {
    try {
      const sourcePath = join(process.cwd(), 'uploads', filename);
      const targetPath = join(process.cwd(), 'dist', 'uploads', filename);
      
      // Criar pasta dist/uploads se não existir
      const targetDir = join(process.cwd(), 'dist', 'uploads');
      const fs = require('fs');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      await copyFile(sourcePath, targetPath);
      console.log(`✅ Imagem copiada automaticamente: ${filename}`);
    } catch (error) {
      console.error(`❌ Erro ao copiar imagem ${filename}:`, error.message);
    }
  }

  async create(createProductDto: CreateProductDto, images?: Array<Express.Multer.File>): Promise<Product> {
    const { variations, ...productData } = createProductDto
    const product = this.productRepository.create(productData)
    if (variations && variations.length > 0) {
      product.variations = variations.map((variation) =>
        this.variationRepository.create(variation),
      )
    }
    if (images && images.length > 0) {
      // Copiar imagens automaticamente para dist/uploads
      for (const image of images) {
        await this.copyImageToDist(image.filename);
      }
      
      product.images = images.map((file, index) =>
        this.imageRepository.create({ 
          url: `/uploads/${file.filename}`,
          isMain: index === 0 // A primeira imagem será a principal
        }),
      )
    }
    return this.productRepository.save(product)
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['variations', 'images'],
      order: { id: 'DESC' },
    })
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations', 'images'],
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    return product;
  }

  async update(id: number, updateProductDto: any, images?: Array<Express.Multer.File>): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations', 'images'],
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    // Atualizar dados básicos do produto
    Object.assign(product, {
      name: updateProductDto.name,
      description: updateProductDto.description,
      price: updateProductDto.price,
      wholesalePrice: updateProductDto.wholesalePrice,
      priceUSD: updateProductDto.priceUSD,
      wholesalePriceUSD: updateProductDto.wholesalePriceUSD,
      category: updateProductDto.category,
      stock: updateProductDto.stock,
      status: updateProductDto.status,
      sku: updateProductDto.sku,
      weight: updateProductDto.weight,
      dimensions: updateProductDto.dimensions,
      youtubeUrl: updateProductDto.youtubeUrl,
    });

    // Atualizar variações
    if (updateProductDto.variations) {
      // Remover variações existentes
      if (product.variations) {
        await this.variationRepository.remove(product.variations);
      }
      
      // Criar novas variações
      product.variations = updateProductDto.variations.map((variation: any) =>
        this.variationRepository.create(variation),
      );
    }

    // Gerenciar imagens existentes e novas
    if (updateProductDto.existingImages) {
      const existingImagesData = JSON.parse(updateProductDto.existingImages);
      const existingImageIds = existingImagesData.map((img: any) => img.id);
      
      // Remover imagens que não estão mais na lista
      if (product.images) {
        const imagesToRemove = product.images.filter(img => !existingImageIds.includes(img.id));
        if (imagesToRemove.length > 0) {
          await this.imageRepository.remove(imagesToRemove);
        }
        
        // Manter apenas as imagens que ainda estão na lista
        product.images = product.images.filter(img => existingImageIds.includes(img.id));
        
        // Atualizar propriedade isMain das imagens existentes
        product.images.forEach(img => {
          const existingImageData = existingImagesData.find((data: any) => data.id === img.id);
          if (existingImageData) {
            img.isMain = existingImageData.isMain;
          }
        });
      }
    } else {
      // Se não há existingImages, remover todas as imagens existentes
      if (product.images && product.images.length > 0) {
        await this.imageRepository.remove(product.images);
        product.images = [];
      }
    }

    // Adicionar novas imagens se houver
    if (images && images.length > 0) {
      // Copiar imagens automaticamente para dist/uploads
      for (const image of images) {
        await this.copyImageToDist(image.filename);
      }
      
      // Processar informações sobre quais imagens são principais
      let newImagesInfo: any[] = [];
      if (updateProductDto.newImagesInfo) {
        newImagesInfo = JSON.parse(updateProductDto.newImagesInfo);
      }
      
      const newImages = images.map((file, index) => {
        const imageInfo = newImagesInfo.find(info => info.id === file.originalname || index === 0);
        return this.imageRepository.create({ 
          url: `/uploads/${file.filename}`,
          isMain: imageInfo ? imageInfo.isMain : false
        });
      });
      
      // Se não há imagem principal definida, a primeira será principal
      const hasMainImage = newImages.some(img => img.isMain) || 
                          (product.images && product.images.some(img => img.isMain));
      
      if (!hasMainImage && newImages.length > 0) {
        newImages[0].isMain = true;
      }
      
      product.images = [...(product.images || []), ...newImages];
    }

    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations', 'images'],
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    // Deletar arquivos físicos das imagens
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          const filePath = join(process.cwd(), image.url);
          await unlink(filePath);
        } catch (error) {
          // Continua mesmo se não conseguir deletar o arquivo
        }
      }
    }

    // Deletar o produto (isso também deletará as variações e imagens do banco devido ao cascade)
    await this.productRepository.remove(product);
    
    return { message: 'Produto deletado com sucesso' };
  }

  async toggleFavorite(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variations', 'images'],
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    product.isFavorite = !product.isFavorite;
    return this.productRepository.save(product);
  }

  async getFavorites(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isFavorite: true },
      relations: ['variations', 'images'],
      order: { id: 'DESC' },
    });
  }
} 