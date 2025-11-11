import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
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
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserService],
  exports: [AuthService],
})
export class AuthModule {} 