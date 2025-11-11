import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { ProductVariation } from './entities/product-variation.entity'
import { ProductService } from './product.service'
import { ProductController } from './product.controller'
import { UploadsModule } from '../uploads/uploads.module'
import { Category } from '../category/entities/category.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariation, Category]), UploadsModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}