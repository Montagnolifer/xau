import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { CategoryService } from './category.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Category } from './entities/category.entity'
import { CategoryFlatNode, CategoryTreeNode } from './types/category.types'

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(createCategoryDto)
  }

  @Get()
  findTree(): Promise<CategoryTreeNode[]> {
    return this.categoryService.findTree()
  }

  @Get('flat')
  findFlat(): Promise<CategoryFlatNode[]> {
    return this.categoryService.findFlat()
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CategoryFlatNode> {
    return this.categoryService.findOne(+id)
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    return this.categoryService.update(+id, updateCategoryDto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(+id)
  }
}

