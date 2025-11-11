import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        const expiresInConfig = configService.get<string>('jwt.expiresIn') || '7d';
        // Converte string para número (em segundos)
        let expiresIn: number;
        if (expiresInConfig.endsWith('d')) {
          const days = parseInt(expiresInConfig.replace('d', ''), 10);
          expiresIn = days * 24 * 60 * 60; // dias para segundos
        } else if (expiresInConfig.endsWith('h')) {
          const hours = parseInt(expiresInConfig.replace('h', ''), 10);
          expiresIn = hours * 60 * 60; // horas para segundos
        } else if (expiresInConfig.endsWith('m')) {
          const minutes = parseInt(expiresInConfig.replace('m', ''), 10);
          expiresIn = minutes * 60; // minutos para segundos
        } else {
          expiresIn = parseInt(expiresInConfig, 10); // assume segundos
        }
        
        return {
          secret: configService.get<string>('jwt.secret') || 'default-secret',
          signOptions: { expiresIn },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtStrategy],
  exports: [AdminService],
})
export class AdminModule {} 