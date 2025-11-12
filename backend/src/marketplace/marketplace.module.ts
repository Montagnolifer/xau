import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { MarketplaceAccount } from './entities/marketplace-account.entity'
import { MarketplaceService } from './marketplace.service'
import { MarketplaceController } from './marketplace.controller'
import { MercadoLivreService } from './ml/ml.service'
import { MercadoLivreController } from './ml/ml.controller'

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceAccount]), HttpModule],
  controllers: [MarketplaceController, MercadoLivreController],
  providers: [MarketplaceService, MercadoLivreService],
  exports: [MarketplaceService, MercadoLivreService],
})
export class MarketplaceModule {}

