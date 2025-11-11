import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { CloudflareR2Module } from '../cloudflare-r2/cloudflare-r2.module';

@Module({
  imports: [
    CloudflareR2Module,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Determina o destino baseado no tipo de upload
          const uploadType = req.params.type || 'general';
          cb(null, `./src/uploads/${uploadType}`);
        },
        filename: (req, file, cb) => {
          // Gera nome único para o arquivo
          const uniqueName = uuidv4();
          const extension = extname(file.originalname);
          cb(null, `${uniqueName}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Filtra apenas imagens
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos de imagem são permitidos'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {} 