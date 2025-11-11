import { Controller, Post, Get, Put, Body, ValidationPipe, HttpStatus, HttpCode, UseGuards, Request, Param, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<{
    message: string;
    user: UserResponseDto;
  }> {
    const user = await this.userService.create(createUserDto);
    
    return {
      message: 'Usuário criado com sucesso!',
      user,
    };
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllForAdmin(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<UserResponseDto | null> {
    return this.userService.getProfile(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Param('id') id: string, @Body() updateData: Partial<CreateUserDto>): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(id, updateData);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }
} 