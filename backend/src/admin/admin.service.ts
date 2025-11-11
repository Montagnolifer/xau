import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity';
import { LoginAdminDto } from './dto/login-admin.dto';
import { AdminResponseDto } from './dto/admin-response.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<AdminResponseDto | null> {
    const admin = await this.adminRepository.findOne({ where: { email } });
    
    if (admin && await bcrypt.compare(password, admin.password)) {
      const { password, ...result } = admin;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginAdminDto) {
    const admin = await this.validateAdmin(loginDto.email, loginDto.password);
    
    if (!admin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    const payload = { 
      sub: admin.id, 
      email: admin.email,
      name: admin.name,
      role: 'admin'
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
      }
    };
  }

  async findById(id: string): Promise<AdminResponseDto | null> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (admin) {
      const { password, ...result } = admin;
      return result;
    }
    return null;
  }

  async findByEmail(email: string): Promise<AdminResponseDto | null> {
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (admin) {
      const { password, ...result } = admin;
      return result;
    }
    return null;
  }
} 