import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Package } from './entities/package.entity'
import { CreatePackageDto } from './dto/create-package.dto'
import { UpdatePackageDto } from './dto/update-package.dto'
import { copyFile } from 'fs/promises'
import { join } from 'path'

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
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

  async create(createPackageDto: any): Promise<Package> {
    // Copiar imagem automaticamente se houver
    if (createPackageDto.image) {
      const filename = createPackageDto.image.replace('/uploads/', '');
      await this.copyImageToDist(filename);
    }
    
    const packageEntity = this.packageRepository.create(createPackageDto)
    const saved = await this.packageRepository.save(packageEntity)
    return Array.isArray(saved) ? saved[0] : saved
  }

  async findAll(): Promise<Package[]> {
    return await this.packageRepository.find({
      order: { createdAt: 'DESC' },
    })
  }

  async findActive(): Promise<Package[]> {
    return await this.packageRepository.find({
      where: { status: true },
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: number): Promise<Package> {
    const packageEntity = await this.packageRepository.findOne({
      where: { id },
    })

    if (!packageEntity) {
      throw new NotFoundException(`Pacote com ID ${id} não encontrado`)
    }

    return packageEntity
  }

  async update(id: number, updatePackageDto: any): Promise<Package> {
    const packageEntity = await this.findOne(id)
    
    // Copiar imagem automaticamente se houver nova imagem
    if (updatePackageDto.image && updatePackageDto.image !== packageEntity.image) {
      const filename = updatePackageDto.image.replace('/uploads/', '');
      await this.copyImageToDist(filename);
    }
    
    Object.assign(packageEntity, updatePackageDto)
    return await this.packageRepository.save(packageEntity)
  }

  async remove(id: number): Promise<void> {
    const packageEntity = await this.findOne(id)
    await this.packageRepository.remove(packageEntity)
  }

  async findByCategory(category: string): Promise<Package[]> {
    return await this.packageRepository.find({
      where: { category, status: true },
      order: { createdAt: 'DESC' },
    })
  }
} 