import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import * as multer from 'multer';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post(':type')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Apenas imagens são permitidas'), false);
        }
        cb(null, true);
      },
      // Removido o limite de fileSize para permitir uploads sem limite
    })
  )
  async uploadFile(
    @Param('type') type: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Gera nome único para o arquivo
    const uniqueName = uuidv4();
    const extension = extname(file.originalname);
    const filename = `${uniqueName}${extension}`;

    // Adiciona o filename ao objeto do arquivo
    file.filename = filename;

    console.log('Arquivo recebido no controller:', {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
    });

    // Configurações específicas por tipo
    const options = this.getUploadOptions(type);

    const result = await this.uploadsService.processImage(file, type, options);

    return {
      success: true,
      data: {
        ...result,
        // As URLs já vêm do R2 no resultado do processImage
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
      },
    };
  }

  @Delete(':type/:filename')
  async deleteFile(
    @Param('type') type: string,
    @Param('filename') filename: string,
  ) {
    await this.uploadsService.deleteFile(type, filename);

    return {
      success: true,
      message: 'Arquivo deletado com sucesso',
    };
  }

  private getUploadOptions(type: string) {
    switch (type) {
      case 'brands':
        return {
          resize: { width: 400, height: 400 },
          quality: 85,
          createThumbnail: true,
          thumbnailSize: { width: 150, height: 150 },
        };
      case 'products':
        return {
          resize: { width: 800, height: 800 },
          quality: 90,
          createThumbnail: false, // Não criar thumbnails para produtos
        };
      case 'categories':
        return {
          resize: { width: 400, height: 400 },
          quality: 85,
          createThumbnail: false, // Não criar thumbnails para categorias
        };
      case 'team':
        return {
          resize: { width: 300, height: 300 },
          quality: 85,
          createThumbnail: false, // Não criar thumbnails para equipe
        };
      default:
        return {
          resize: { width: 600, height: 600 },
          quality: 80,
          createThumbnail: true,
          thumbnailSize: { width: 150, height: 150 },
        };
    }
  }
} 