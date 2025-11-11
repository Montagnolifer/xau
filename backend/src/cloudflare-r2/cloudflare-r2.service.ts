import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Tipo para arquivo do Multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class CloudflareR2Service {
  private readonly logger = new Logger(CloudflareR2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'llioraflow';
    
    // Verificar se as variáveis de ambiente estão definidas
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Variáveis de ambiente do Cloudflare R2 não configuradas');
    }
    
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: MulterFile,
    folder: string,
    customFilename?: string,
    useSignedUrl: boolean = false
  ): Promise<{ url: string; filename: string; originalName: string; size: number; signedUrl?: string }> {
    try {
      const filename = customFilename || `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
      const key = `${folder}/${filename}`;

      // Ler o arquivo do disco se o buffer não estiver disponível
      let fileBuffer: Buffer;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else {
        const fs = require('fs');
        fileBuffer = fs.readFileSync(file.path);
      }

      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client.send(uploadCommand);

      const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
      const url = publicDomain ? `https://${publicDomain}/${key}` : `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;

      this.logger.log(`✅ Arquivo enviado para R2: ${key}`);

      const result: any = {
        url,
        filename,
        originalName: file.originalname,
        size: file.size,
      };

      // Se solicitado, gerar URL assinada como backup
      if (useSignedUrl) {
        try {
          const signedUrl = await this.getSignedUrl(folder, filename, 24 * 60 * 60); // 24 horas
          result.signedUrl = signedUrl;
          this.logger.log(`🔐 URL assinada gerada para: ${key}`);
        } catch (error) {
          this.logger.warn(`⚠️ Erro ao gerar URL assinada: ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ Erro ao fazer upload para R2: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(folder: string, filename: string): Promise<boolean> {
    try {
      const key = `${folder}/${filename}`;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log(`✅ Arquivo deletado do R2: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao deletar arquivo do R2: ${error.message}`);
      return false;
    }
  }

  async getSignedUrl(folder: string, filename: string, expiresIn: number = 3600): Promise<string> {
    try {
      const key = `${folder}/${filename}`;

      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar URL assinada: ${error.message}`);
      throw error;
    }
  }

  async fileExists(folder: string, filename: string): Promise<boolean> {
    try {
      const key = `${folder}/${filename}`;

      const headCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Método para gerar URL assinada para arquivo existente
  async getSignedUrlForExistingFile(folder: string, filename: string, expiresIn: number = 24 * 60 * 60): Promise<string> {
    try {
      const exists = await this.fileExists(folder, filename);
      if (!exists) {
        throw new Error(`Arquivo não encontrado: ${folder}/${filename}`);
      }

      return await this.getSignedUrl(folder, filename, expiresIn);
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar URL assinada para arquivo existente: ${error.message}`);
      throw error;
    }
  }

  // Método para verificar se uma URL pública está acessível
  async checkPublicUrlAccess(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      this.logger.warn(`⚠️ URL pública não acessível: ${url}`);
      return false;
    }
  }

  // Método para obter URL alternativa (assinada) se a pública falhar
  async getAlternativeUrl(folder: string, filename: string, publicUrl: string): Promise<string> {
    try {
      const isAccessible = await this.checkPublicUrlAccess(publicUrl);
      if (isAccessible) {
        return publicUrl;
      }

      // Se a URL pública não estiver acessível, usar URL assinada
      this.logger.log(`🔄 URL pública não acessível, usando URL assinada para: ${folder}/${filename}`);
      return await this.getSignedUrl(folder, filename, 24 * 60 * 60);
    } catch (error) {
      this.logger.error(`❌ Erro ao obter URL alternativa: ${error.message}`);
      throw error;
    }
  }
} 