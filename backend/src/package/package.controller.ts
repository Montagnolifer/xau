import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { PackageService } from './package.service'
import { CreatePackageDto } from './dto/create-package.dto'
import { UpdatePackageDto } from './dto/update-package.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

function fileNameEdit(req, file, callback) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  callback(null, uniqueSuffix + extname(file.originalname))
}

@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: './uploads',
        filename: fileNameEdit,
      }),
    })
  )
  async create(
    @Body() createPackageDto: any,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
    // Processar dados do formulário
    const processedData: any = {}
    
    // Processar campos básicos
    processedData.name = createPackageDto.name
    processedData.description = createPackageDto.description
    processedData.category = createPackageDto.category
    processedData.deliveryTime = createPackageDto.deliveryTime
    
    // Processar preços
    processedData.originalPrice = Number(createPackageDto.originalPrice)
    processedData.currentPrice = Number(createPackageDto.currentPrice)
    
    // Processar status
    processedData.status = createPackageDto.status === 'true' || createPackageDto.status === true
    
    // Processar highlights
    if (createPackageDto.highlights) {
      try {
        processedData.highlights = typeof createPackageDto.highlights === 'string' 
          ? JSON.parse(createPackageDto.highlights) 
          : createPackageDto.highlights
      } catch (error) {
        console.error('Erro ao processar highlights:', error)
        processedData.highlights = []
      }
    }
    
    // Processar services
    if (createPackageDto.services) {
      try {
        processedData.services = typeof createPackageDto.services === 'string' 
          ? JSON.parse(createPackageDto.services) 
          : createPackageDto.services
      } catch (error) {
        console.error('Erro ao processar services:', error)
        processedData.services = []
      }
    }

    // Adicionar caminho da imagem se foi enviada
    if (files?.image?.[0]) {
      processedData.image = `/uploads/${files.image[0].filename}`
    }

    const packageEntity = await this.packageService.create(processedData)
    return {
      message: 'Pacote criado com sucesso',
      data: packageEntity,
    }
  }

  @Get()
  async findAll() {
    const packages = await this.packageService.findActive()
    return {
      message: 'Pacotes encontrados com sucesso',
      data: packages,
    }
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin() {
    const packages = await this.packageService.findAll()
    return {
      message: 'Pacotes encontrados com sucesso',
      data: packages,
    }
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    const packages = await this.packageService.findByCategory(category)
    return {
      message: 'Pacotes encontrados com sucesso',
      data: packages,
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const packageEntity = await this.packageService.findOne(+id)
    return {
      message: 'Pacote encontrado com sucesso',
      data: packageEntity,
    }
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  async findOneAdmin(@Param('id') id: string) {
    const packageEntity = await this.packageService.findOne(+id)
    return {
      message: 'Pacote encontrado com sucesso',
      data: packageEntity,
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: './uploads',
        filename: fileNameEdit,
      }),
    })
  )
  async update(
    @Param('id') id: string,
    @Body() updatePackageDto: any,
    @UploadedFiles() files: { image?: Express.Multer.File[] },
  ) {
    
    // Processar dados do formulário
    const processedData: any = {}
    
    // Processar campos básicos
    if (updatePackageDto.name) processedData.name = updatePackageDto.name
    if (updatePackageDto.description) processedData.description = updatePackageDto.description
    if (updatePackageDto.category) processedData.category = updatePackageDto.category
    if (updatePackageDto.deliveryTime) processedData.deliveryTime = updatePackageDto.deliveryTime
    
    // Processar preços
    if (updatePackageDto.originalPrice) {
      processedData.originalPrice = Number(updatePackageDto.originalPrice)
    }
    if (updatePackageDto.currentPrice) {
      processedData.currentPrice = Number(updatePackageDto.currentPrice)
    }
    
    // Processar status
    if (updatePackageDto.status !== undefined) {
      processedData.status = updatePackageDto.status === 'true' || updatePackageDto.status === true
    }
    
    // Processar highlights
    if (updatePackageDto.highlights) {
      try {
        processedData.highlights = typeof updatePackageDto.highlights === 'string' 
          ? JSON.parse(updatePackageDto.highlights) 
          : updatePackageDto.highlights
      } catch (error) {
        console.error('Erro ao processar highlights:', error)
        processedData.highlights = []
      }
    }
    
    // Processar services
    if (updatePackageDto.services) {
      try {
        processedData.services = typeof updatePackageDto.services === 'string' 
          ? JSON.parse(updatePackageDto.services) 
          : updatePackageDto.services
      } catch (error) {
        console.error('Erro ao processar services:', error)
        processedData.services = []
      }
    }

    // Adicionar caminho da imagem se foi enviada
    if (files?.image?.[0]) {
      processedData.image = `/uploads/${files.image[0].filename}`
    }

    try {
      const packageEntity = await this.packageService.update(+id, processedData)
      return {
        message: 'Pacote atualizado com sucesso',
        data: packageEntity,
      }
    } catch (error) {
      console.error('Erro no service.update:', error)
      throw error
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.packageService.remove(+id)
  }
} 