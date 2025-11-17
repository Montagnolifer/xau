import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { MarketplaceAccount } from './entities/marketplace-account.entity'
import { MarketplaceService } from './marketplace.service'
import { MarketplaceController } from './marketplace.controller'
import { MercadoLivreService } from './ml/ml.service'
import { MercadoLivreController } from './ml/ml.controller'
import { ShopeeService } from './shopee/shopee.service'
import { ShopeeController } from './shopee/shopee.controller'
import { ProductModule } from '../product/product.module'

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceAccount]), HttpModule, ProductModule],
  controllers: [MarketplaceController, MercadoLivreController, ShopeeController],
  providers: [MarketplaceService, MercadoLivreService, ShopeeService],
  exports: [MarketplaceService, MercadoLivreService, ShopeeService],
})
export class MarketplaceModule {}

