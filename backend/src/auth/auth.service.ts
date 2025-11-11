import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(whatsapp: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { whatsapp } });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.whatsapp, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Dados incorretos');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    // Atualizar a data/hora do último acesso
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date()
    });

    const payload = { 
      sub: user.id, 
      whatsapp: user.whatsapp,
      name: user.name,
      role: 'user' // Definir role como 'user' para usuários comuns
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        isActive: user.isActive,
        isWholesale: user.isWholesale,
        lastLoginAt: new Date(),
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        neighborhood: user.neighborhood,
        number: user.number,
        complement: user.complement,
      }
    };
  }

  async register(registerDto: RegisterDto) {
    // Verificar se o usuário já existe
    const existingUser = await this.userRepository.findOne({ 
      where: { whatsapp: registerDto.whatsapp } 
    });

    if (existingUser) {
      throw new ConflictException('WhatsApp já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Criar novo usuário
    const user = this.userRepository.create({
      name: registerDto.name,
      whatsapp: registerDto.whatsapp,
      password: hashedPassword,
      agreeMarketing: registerDto.agreeMarketing || false,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Gerar token JWT
    const payload = { 
      sub: savedUser.id, 
      whatsapp: savedUser.whatsapp,
      name: savedUser.name,
      role: 'user' // Definir role como 'user' para usuários comuns
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: savedUser.id,
        name: savedUser.name,
        whatsapp: savedUser.whatsapp,
        isActive: savedUser.isActive,
      }
    };
  }
} 