import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync } from 'fs';
import * as sharp from 'sharp';
import { CloudflareR2Service } from '../cloudflare-r2/cloudflare-r2.service';

export interface UploadResult {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  thumbnailPath?: string;
  url: string;
  thumbnailUrl?: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly cloudflareR2Service: CloudflareR2Service) {
    // Não precisamos mais criar pastas locais
  }

  async processImage(
    file: any,
    uploadType: string,
    options?: {
      resize?: { width: number; height: number };
      quality?: number;
      createThumbnail?: boolean;
      thumbnailSize?: { width: number; height: number };
    }
  ): Promise<UploadResult> {
    console.log('=== UPLOADS SERVICE DEBUG ===');
    console.log('Arquivo recebido:', file);
    console.log('Tipo de upload:', uploadType);
    console.log('Opções:', options);
    console.log('Filename:', file.filename);
    console.log('Originalname:', file.originalname);
    console.log('================================');

    try {
      // Verificar se o arquivo existe
      if (!file.path && !file.buffer) {
        throw new BadRequestException('Arquivo inválido: caminho ou buffer não encontrado');
      }

      console.log('Arquivo path:', file.path);
      console.log('Mimetype:', file.mimetype);

      // Processa a imagem com Sharp
      let imageProcessor: sharp.Sharp;
      
      if (file.buffer) {
        imageProcessor = sharp(file.buffer, { failOnError: false });
      } else {
        imageProcessor = sharp(file.path, { failOnError: false });
      }

      // Redimensiona se especificado
      if (options?.resize) {
        imageProcessor = imageProcessor.resize(
          options.resize.width,
          options.resize.height,
          { fit: 'inside', withoutEnlargement: true }
        );
      }

      // Define qualidade se especificado
      if (options?.quality) {
        imageProcessor = imageProcessor.jpeg({ quality: options.quality });
      }

      // Converte para buffer
      const processedBuffer = await imageProcessor.toBuffer();

      // Cria um objeto de arquivo para o R2
      const processedFile = {
        ...file,
        buffer: processedBuffer,
        size: processedBuffer.length,
        mimetype: file.mimetype,
        originalname: file.originalname,
        filename: file.filename
      };

      // Upload para o R2
      const uploadResult = await this.cloudflareR2Service.uploadFile(
        processedFile,
        uploadType,
        file.filename,
        true // usar URL assinada como backup
      );

      // Cria thumbnail se solicitado (apenas para marcas, não para categorias)
      let thumbnailUrl: string | undefined;
      let thumbnailPath: string | undefined;
      
      if (options?.createThumbnail && uploadType !== 'categories') {
        const thumbnailSize = options.thumbnailSize || { width: 150, height: 150 };
        const thumbnailFilename = `thumb_${file.filename}`;
        
        // Processa thumbnail
        let thumbnailProcessor: sharp.Sharp;
        
        if (file.buffer) {
          thumbnailProcessor = sharp(file.buffer, { failOnError: false });
        } else {
          thumbnailProcessor = sharp(file.path, { failOnError: false });
        }

        const thumbnailBuffer = await thumbnailProcessor
          .resize(thumbnailSize.width, thumbnailSize.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Upload do thumbnail para o R2
        const thumbnailFile = {
          ...file,
          buffer: thumbnailBuffer,
          size: thumbnailBuffer.length,
          mimetype: file.mimetype,
          originalname: file.originalname,
          filename: thumbnailFilename
        };

        const thumbnailUploadResult = await this.cloudflareR2Service.uploadFile(
          thumbnailFile,
          uploadType,
          thumbnailFilename,
          true
        );

        thumbnailUrl = thumbnailUploadResult.url;
        thumbnailPath = `${uploadType}/${thumbnailFilename}`;
      }

      // Limpa arquivos temporários locais se existirem
      if (file.path && existsSync(file.path)) {
        try {
          const fs = require('fs').promises;
          await fs.unlink(file.path);
        } catch (deleteError) {
          console.error('Erro ao deletar arquivo temporário local:', deleteError);
        }
      }

      return {
        filename: file.filename,
        originalName: file.originalname,
        path: `${uploadType}/${file.filename}`,
        size: processedBuffer.length,
        mimetype: file.mimetype,
        thumbnailPath,
        url: uploadResult.url,
        thumbnailUrl,
      };
    } catch (error) {
      console.error('Erro no processamento da imagem:', error);
      
      // Limpa arquivos temporários locais se existirem
      if (file.path && existsSync(file.path)) {
        try {
          const fs = require('fs').promises;
          await fs.unlink(file.path);
        } catch (deleteError) {
          console.error('Erro ao deletar arquivo após falha:', deleteError);
        }
      }
      
      let errorMessage = 'Erro ao processar imagem';
      if (error.message.includes('Cannot use same file')) {
        errorMessage = 'Erro interno no processamento da imagem';
      } else if (error.message.includes('Input buffer contains unsupported image format')) {
        errorMessage = 'Formato de imagem não suportado';
      } else if (error.message.includes('Input file is missing')) {
        errorMessage = 'Arquivo de imagem inválido';
      } else {
        errorMessage = error.message;
      }
      
      throw new BadRequestException(errorMessage);
    }
  }

  async deleteFile(uploadType: string, filename: string): Promise<void> {
    try {
      // Deleta do R2
      const deleted = await this.cloudflareR2Service.deleteFile(uploadType, filename);
      
      if (deleted) {
        console.log(`Arquivo deletado do R2: ${uploadType}/${filename}`);
      } else {
        console.log(`Arquivo não encontrado no R2: ${uploadType}/${filename}`);
      }

      // Tenta deletar thumbnail se existir (apenas para marcas, não para categorias)
      if (uploadType !== 'products' && uploadType !== 'categories') {
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailDeleted = await this.cloudflareR2Service.deleteFile(uploadType, thumbnailFilename);
        
        if (thumbnailDeleted) {
          console.log(`Thumbnail deletado do R2: ${uploadType}/${thumbnailFilename}`);
        }
      }
    } catch (error) {
      console.error(`Erro ao deletar arquivo ${filename} do R2:`, error);
      // Não lançar exceção para não interromper o processo de deletar categoria
    }
  }

  getFileUrl(uploadType: string, filename: string): string {
    // Retorna a URL do R2
    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
    if (publicDomain) {
      return `https://${publicDomain}/${uploadType}/${filename}`;
    }
    
    // Fallback para URL do R2 direta
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'llioraflow';
    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${uploadType}/${filename}`;
  }
} 