import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import * as XLSX from 'xlsx'
import { CreateProductDto } from './dto/create-product.dto'

interface ExcelRow {
  [key: string]: any
}

interface ProductGroup {
  name: string
  baseData: Partial<CreateProductDto>
  variantRows: ExcelRow[]
}

@Injectable()
export class XlsxParserService {
  private readonly logger = new Logger(XlsxParserService.name)

  parseFile(buffer: Buffer): CreateProductDto[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      if (!worksheet) {
        throw new BadRequestException('Planilha vazia ou inválida')
      }

      const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        raw: false,
        defval: '',
      })

      if (rows.length === 0) {
        throw new BadRequestException('Nenhuma linha de dados encontrada na planilha')
      }

      // Agrupar produtos por nome
      const productGroups = this.groupProductsByName(rows)

      // Converter grupos em CreateProductDto
      const products = productGroups.map((group) => this.convertGroupToProductDto(group))

      return products
    } catch (error) {
      this.logger.error('Erro ao parsear arquivo XLSX', error)
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Erro ao processar arquivo XLSX: ' + (error?.message || 'Erro desconhecido'))
    }
  }

  private groupProductsByName(rows: ExcelRow[]): ProductGroup[] {
    const groups = new Map<string, ProductGroup>()

    for (const row of rows) {
      const productName = this.getCellValue(row, 'Nome do Anúncio')

      if (!productName || productName.trim() === '') {
        continue // Pular linhas sem nome
      }

      const normalizedName = productName.trim()

      if (!groups.has(normalizedName)) {
        // Primeira linha do produto - dados base
        groups.set(normalizedName, {
          name: normalizedName,
          baseData: this.extractBaseData(row),
          variantRows: [row],
        })
      } else {
        // Linha adicional com variação
        const group = groups.get(normalizedName)!
        group.variantRows.push(row)
      }
    }

    return Array.from(groups.values())
  }

  private extractBaseData(row: ExcelRow): Partial<CreateProductDto> {
    const categoryId = this.parseNumber(this.getCellValue(row, 'Categoria ID'))
    const price = this.parseNumber(this.getCellValue(row, 'Preço'))
    const wholesalePrice = this.parseNumber(this.getCellValue(row, 'Preço com Desconto'))
    const stock = this.parseNumber(this.getCellValue(row, 'Quantidade'))
    const weight = this.parseNumber(this.getCellValue(row, 'Peso (kg)'))

    // Extrair dimensões
    const length = this.parseNumber(this.getCellValue(row, 'Comprimento (cm)'))
    const width = this.parseNumber(this.getCellValue(row, 'Largura (cm)'))
    const height = this.parseNumber(this.getCellValue(row, 'Altura (cm)'))
    let dimensions: string | undefined
    if (length || width || height) {
      dimensions = `${length || 0}x${width || 0}x${height || 0}`
    }

    // Extrair imagens
    const images: string[] = []
    const coverImage = this.getCellValue(row, 'Imagem de Capa')
    if (coverImage) images.push(coverImage)

    for (let i = 1; i <= 9; i++) {
      const imageUrl = this.getCellValue(row, `Imagem de Anúncio${i}`)
      if (imageUrl && !images.includes(imageUrl)) {
        images.push(imageUrl)
      }
    }

    // Tentar obter nome da categoria de uma coluna específica, se existir
    const categoryName = this.getCellValue(row, 'Nome da Categoria') || 
                         this.getCellValue(row, 'Categoria') || 
                         'Sem categoria'

    return {
      name: this.getCellValue(row, 'Nome do Anúncio')?.trim() || '',
      description: this.getCellValue(row, 'Descrição')?.trim() || '',
      categoryId: categoryId || undefined,
      category: categoryName.trim() || 'Sem categoria',
      sku: this.getCellValue(row, 'SKU Principal')?.trim() || undefined,
      price: price || undefined,
      wholesalePrice: wholesalePrice || undefined,
      stock: stock || undefined,
      weight: weight || undefined,
      dimensions: dimensions,
      images: images.length > 0 ? images : undefined,
      status: true, // Padrão ativo
    }
  }

  private convertGroupToProductDto(group: ProductGroup): CreateProductDto {
    const baseData = { ...group.baseData }

    // Processar variações
    const variationAxes: Array<{ name: string; options: string[] }> = []
    const variantItems: Array<{
      options: Record<string, string>
      sku?: string
      price: number
      wholesalePrice?: number
      priceUSD?: number
      wholesalePriceUSD?: number
      stock: number
    }> = []

    // Verificar se há variações
    const hasVariation1 = this.getCellValue(group.variantRows[0], 'Nome Variante1')
    const hasVariation2 = this.getCellValue(group.variantRows[0], 'Nome Variante2')

    if (hasVariation1 || hasVariation2) {
      // Processar eixos de variação
      if (hasVariation1) {
        const variant1Name = this.getCellValue(group.variantRows[0], 'Nome Variante1')?.trim() || ''
        const variant1Options = new Set<string>()

        for (const row of group.variantRows) {
          const option = this.getCellValue(row, 'Opção por Variante1')?.trim()
          if (option) variant1Options.add(option)
        }

        if (variant1Options.size > 0) {
          variationAxes.push({
            name: variant1Name,
            options: Array.from(variant1Options),
          })
        }
      }

      if (hasVariation2) {
        const variant2Name = this.getCellValue(group.variantRows[0], 'Nome Variante2')?.trim() || ''
        const variant2Options = new Set<string>()

        for (const row of group.variantRows) {
          const option = this.getCellValue(row, 'Opção por Variante2')?.trim()
          if (option) variant2Options.add(option)
        }

        if (variant2Options.size > 0) {
          variationAxes.push({
            name: variant2Name,
            options: Array.from(variant2Options),
          })
        }
      }

      // Processar variant items (evitando duplicatas)
      const variantItemsMap = new Map<string, {
        options: Record<string, string>
        sku?: string
        price: number
        stock: number
      }>()

      for (const row of group.variantRows) {
        const variantSku = this.getCellValue(row, 'SKU')?.trim()
        const variantPrice = this.parseNumber(this.getCellValue(row, 'Preço')) || baseData.price || 0
        const variantStock = this.parseNumber(this.getCellValue(row, 'Quantidade')) || 0

        const options: Record<string, string> = {}
        const variant1Option = this.getCellValue(row, 'Opção por Variante1')?.trim()
        const variant2Option = this.getCellValue(row, 'Opção por Variante2')?.trim()

        if (variant1Option && hasVariation1) {
          const variant1Name = this.getCellValue(group.variantRows[0], 'Nome Variante1')?.trim() || ''
          options[variant1Name] = variant1Option
        }

        if (variant2Option && hasVariation2) {
          const variant2Name = this.getCellValue(group.variantRows[0], 'Nome Variante2')?.trim() || ''
          options[variant2Name] = variant2Option
        }

        if (Object.keys(options).length > 0 || variantSku) {
          // Criar chave única baseada nas opções (ordenadas para garantir consistência)
          const optionsKey = JSON.stringify(
            Object.keys(options)
              .sort()
              .map(key => `${key}:${options[key]}`)
              .join('|')
          )

          // Se já existe um variant item com as mesmas opções, somar o estoque
          if (variantItemsMap.has(optionsKey)) {
            const existing = variantItemsMap.get(optionsKey)!
            existing.stock = (existing.stock || 0) + (variantStock || 0)
            // Usar o menor preço se houver diferença
            if (variantPrice > 0 && (existing.price === 0 || variantPrice < existing.price)) {
              existing.price = variantPrice
            }
            // Atualizar SKU se não existir
            if (!existing.sku && variantSku) {
              existing.sku = variantSku
            }
          } else {
            variantItemsMap.set(optionsKey, {
              options,
              sku: variantSku || undefined,
              price: variantPrice,
              stock: variantStock,
            })
          }
        }
      }

      // Converter map para array
      variantItems.push(...Array.from(variantItemsMap.values()))

      // Se temos variant items, remover preço/estoque do produto base
      if (variantItems.length > 0) {
        baseData.price = undefined
        baseData.stock = undefined
      }
    } else {
      // Sem variações - usar dados da primeira linha
      const firstRow = group.variantRows[0]
      baseData.price = this.parseNumber(this.getCellValue(firstRow, 'Preço')) || baseData.price
      baseData.stock = this.parseNumber(this.getCellValue(firstRow, 'Quantidade')) || baseData.stock
    }

    // Validar dados obrigatórios
    if (!baseData.name) {
      throw new BadRequestException(`Produto sem nome na linha`)
    }

    // Garantir que sempre haja um nome de categoria
    if (!baseData.category || baseData.category.trim() === '') {
      baseData.category = 'Sem categoria'
    }

    // categoryId é opcional - se não existir, será tratado no service
    // Não validamos mais como obrigatório para permitir importação mesmo sem categoria válida

    if (!baseData.price && variantItems.length === 0) {
      throw new BadRequestException(`Produto "${baseData.name}" sem preço`)
    }

    if (baseData.stock === undefined && variantItems.length === 0) {
      throw new BadRequestException(`Produto "${baseData.name}" sem estoque`)
    }

    return {
      ...baseData,
      variationAxes: variationAxes.length > 0 ? variationAxes : undefined,
      variantItems: variantItems.length > 0 ? variantItems : undefined,
    } as CreateProductDto
  }

  private getCellValue(row: ExcelRow, columnName: string): string | undefined {
    // Tentar diferentes variações do nome da coluna
    const variations = [
      columnName,
      columnName.trim(),
      columnName.toLowerCase(),
      columnName.toUpperCase(),
    ]

    for (const variation of variations) {
      if (row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
        return String(row[variation]).trim()
      }
    }

    // Tentar buscar por chave parcial
    for (const key in row) {
      if (key.trim().toLowerCase() === columnName.toLowerCase()) {
        const value = row[key]
        if (value !== undefined && value !== null && value !== '') {
          return String(value).trim()
        }
      }
    }

    return undefined
  }

  private parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined
    }

    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value)

    if (isNaN(num)) {
      return undefined
    }

    return num
  }

  generateTemplate(): Buffer {
    const templateData = [
      {
        'Nome do Anúncio': 'Exemplo Produto',
        'Descrição': 'Descrição do produto exemplo',
        'Categoria ID': '1',
        'SKU Principal': 'PROD001',
        'Preço': '99.90',
        'Preço com Desconto': '79.90',
        'Quantidade': '50',
        'Peso (kg)': '0.5',
        'Comprimento (cm)': '20',
        'Largura (cm)': '15',
        'Altura (cm)': '10',
        'Imagem de Capa': 'https://exemplo.com/imagem1.jpg',
        'Imagem de Anúncio1': 'https://exemplo.com/imagem2.jpg',
        'Imagem de Anúncio2': 'https://exemplo.com/imagem3.jpg',
        'Nome Variante1': 'Cor',
        'Opção por Variante1': 'Vermelho',
        'Nome Variante2': 'Tamanho',
        'Opção por Variante2': 'P',
        'SKU': 'PROD001-VERM-P',
        'ID da Variante': '',
      },
      {
        'Nome do Anúncio': 'Exemplo Produto',
        'Descrição': '',
        'Categoria ID': '',
        'SKU Principal': '',
        'Preço': '',
        'Preço com Desconto': '',
        'Quantidade': '',
        'Peso (kg)': '',
        'Comprimento (cm)': '',
        'Largura (cm)': '',
        'Altura (cm)': '',
        'Imagem de Capa': '',
        'Imagem de Anúncio1': '',
        'Imagem de Anúncio2': '',
        'Nome Variante1': '',
        'Opção por Variante1': 'Azul',
        'Nome Variante2': '',
        'Opção por Variante2': 'M',
        'SKU': 'PROD001-AZUL-M',
        'ID da Variante': '',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos')

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
  }
}

