import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Not } from 'typeorm'
import { Category } from './entities/category.entity'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CategoryFlatNode, CategoryTreeNode } from './types/category.types'

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { parentId } = createCategoryDto

    const parent = parentId
      ? await this.categoryRepository.findOne({ where: { id: parentId } })
      : undefined

    if (parentId && !parent) {
      throw new NotFoundException('Categoria pai não encontrada')
    }

    const slug = await this.ensureUniqueSlug(
      this.generateSlug(createCategoryDto.slug || createCategoryDto.name),
    )

    const category = this.categoryRepository.create({
      name: createCategoryDto.name.trim(),
      description: createCategoryDto.description?.trim() || null,
      status: createCategoryDto.status ?? true,
      parent: parent ?? null,
      position: createCategoryDto.position ?? null,
      slug,
    })

    return this.categoryRepository.save(category)
  }

  async findTree(): Promise<CategoryTreeNode[]> {
    const categories = await this.categoryRepository.find({
      order: { position: 'ASC', name: 'ASC' },
      relations: ['parent'],
    })

    const map = new Map<number, CategoryTreeNode>()
    const roots: CategoryTreeNode[] = []

    for (const category of categories) {
      map.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        status: category.status,
        parentId: category.parent?.id ?? null,
        position: category.position,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        path: [],
        children: [],
      })
    }

    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    const assignPath = (nodes: CategoryTreeNode[], parentPath: string[]) => {
      nodes.sort((a, b) => {
        const positionA = a.position ?? 0
        const positionB = b.position ?? 0
        if (positionA !== positionB) {
          return positionA - positionB
        }
        return a.name.localeCompare(b.name, 'pt-BR')
      })

      for (const node of nodes) {
        node.path = [...parentPath, node.name]
        if (node.children.length) {
          assignPath(node.children, node.path)
        }
      }
    }

    assignPath(roots, [])

    return roots
  }

  async findFlat(): Promise<CategoryFlatNode[]> {
    const tree = await this.findTree()
    const result: CategoryFlatNode[] = []

    const traverse = (nodes: CategoryTreeNode[], depth: number) => {
      for (const node of nodes) {
        result.push({
          id: node.id,
          name: node.name,
          slug: node.slug,
          description: node.description ?? null,
          status: node.status,
          parentId: node.parentId,
      position: node.position,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
          path: node.path,
          depth,
        })
        if (node.children.length) {
          traverse(node.children, depth + 1)
        }
      }
    }

    traverse(tree, 0)

    return result
  }

  async findOne(id: number): Promise<CategoryFlatNode> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    })

    if (!category) {
      throw new NotFoundException('Categoria não encontrada')
    }

    const ancestors = await this.buildAncestors(category)

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      status: category.status,
      parentId: category.parent?.id ?? null,
      position: category.position,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      path: [...ancestors.map((item) => item.name), category.name],
      depth: ancestors.length,
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    })

    if (!category) {
      throw new NotFoundException('Categoria não encontrada')
    }

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === null) {
        category.parent = null
      } else {
        if (updateCategoryDto.parentId === id) {
          throw new BadRequestException('Categoria não pode ser pai de si mesma')
        }

        const parent = await this.categoryRepository.findOne({
          where: { id: updateCategoryDto.parentId },
          relations: ['parent'],
        })

        if (!parent) {
          throw new NotFoundException('Categoria pai não encontrada')
        }

        const descendants = await this.collectDescendantsIds(id)
        if (descendants.has(parent.id)) {
          throw new BadRequestException(
            'Categoria pai não pode ser uma subcategoria da própria categoria',
          )
        }

        category.parent = parent
      }
    }

    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name.trim()
    }

    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description?.trim() || null
    }

    if (updateCategoryDto.status !== undefined) {
      category.status = updateCategoryDto.status
    }

    if (updateCategoryDto.position !== undefined) {
      category.position = updateCategoryDto.position ?? null
    }

    if (updateCategoryDto.slug !== undefined || updateCategoryDto.name !== undefined) {
      const slugSource = updateCategoryDto.slug || category.name
      category.slug = await this.ensureUniqueSlug(
        this.generateSlug(slugSource),
        category.id,
      )
    }

    return this.categoryRepository.save(category)
  }

  async remove(id: number): Promise<void> {
    const exists = await this.categoryRepository.findOne({ where: { id } })
    if (!exists) {
      throw new NotFoundException('Categoria não encontrada')
    }

    await this.categoryRepository.delete(id)
  }

  private async collectDescendantsIds(id: number): Promise<Set<number>> {
    const stack = [id]
    const visited = new Set<number>()

    while (stack.length) {
      const currentId = stack.pop()!
      if (visited.has(currentId)) {
        continue
      }
      visited.add(currentId)

      const children = await this.categoryRepository.find({
        where: { parent: { id: currentId } },
        relations: ['parent'],
      })

      for (const child of children) {
        if (!visited.has(child.id)) {
          stack.push(child.id)
        }
      }
    }

    visited.delete(id)
    return visited
  }

  private async buildAncestors(category: Category): Promise<Category[]> {
    const ancestors: Category[] = []
    let currentParentId = category.parent?.id ?? null

    while (currentParentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: currentParentId },
        relations: ['parent'],
      })

      if (!parent) {
        break
      }

      ancestors.unshift(parent)
      currentParentId = parent.parent?.id ?? null
    }

    return ancestors
  }

  private generateSlug(text: string): string {
    const base = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    return base.length > 0 ? base : 'categoria'
  }

  private async ensureUniqueSlug(slug: string, excludeId?: number): Promise<string> {
    let uniqueSlug = slug
    let counter = 1

    while (
      await this.categoryRepository.findOne({
        where: excludeId
          ? { slug: uniqueSlug, id: Not(excludeId) }
          : { slug: uniqueSlug },
      })
    ) {
      uniqueSlug = `${slug}-${counter}`
      counter += 1
    }

    return uniqueSlug
  }
}

