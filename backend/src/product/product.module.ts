import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { ProductVariation } from './entities/product-variation.entity'
import { ProductImage } from './entities/product-image.entity'
import { ProductService } from './product.service'
import { ProductController } from './product.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariation, ProductImage])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {} 