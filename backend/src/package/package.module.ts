import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PackageService } from './package.service'
import { PackageController } from './package.controller'
import { Package } from './entities/package.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Package])],
  controllers: [PackageController],
  providers: [PackageService],
  exports: [PackageService],
})
export class PackageModule {} 