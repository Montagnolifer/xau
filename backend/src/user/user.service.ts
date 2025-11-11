import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar se já existe um usuário com o mesmo WhatsApp
    const existingUser = await this.userRepository.findOne({
      where: { whatsapp: createUserDto.whatsapp },
    });

    if (existingUser) {
      throw new ConflictException('Já existe um usuário cadastrado com este WhatsApp');
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Criar o usuário
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      currency: createUserDto.currency || 'BRL',
      language: createUserDto.language || 'pt',
    });

    const savedUser = await this.userRepository.save(user);

    // Retornar sem a senha
    const { password, ...userResponse } = savedUser;
    return userResponse as UserResponseDto;
  }

  async findByWhatsapp(whatsapp: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { whatsapp },
    });
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { password, ...userResponse } = user;
    return userResponse as UserResponseDto;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...user }) => user as UserResponseDto);
  }

  async getProfile(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { password, ...userResponse } = user;
    return userResponse as UserResponseDto;
  }

  async updateUser(id: string, updateData: Partial<CreateUserDto>): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    // Se está atualizando o WhatsApp, verificar se já existe outro usuário com o mesmo WhatsApp
    if (updateData.whatsapp && updateData.whatsapp !== user.whatsapp) {
      const existingUser = await this.userRepository.findOne({
        where: { whatsapp: updateData.whatsapp },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Já existe um usuário cadastrado com este WhatsApp');
      }
    }

    // Se está atualizando a senha, criptografar
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Atualizar os dados
    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    // Retornar sem a senha
    const { password, ...userResponse } = updatedUser;
    return userResponse as UserResponseDto;
  }
} 