import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product } from "@/types/product"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para transformar produtos do backend para o formato do frontend
export function transformBackendProduct(backendProduct: any): Product {
  // Extrair tamanhos e cores das variações
  const sizes: string[] = []
  const colors: { name: string; hex: string }[] = []
  
  if (backendProduct.variations) {
    backendProduct.variations.forEach((variation: any) => {
      if (variation.name.toLowerCase().includes('tamanho') || variation.name.toLowerCase().includes('size')) {
        sizes.push(...variation.options)
      } else if (variation.name.toLowerCase().includes('cor') || variation.name.toLowerCase().includes('color')) {
        variation.options.forEach((colorName: string) => {
          // Mapear nomes de cores para códigos hex (você pode expandir este mapeamento)
          const colorMap: { [key: string]: string } = {
            'preto': '#000000',
            'branco': '#FFFFFF',
            'vermelho': '#FF0000',
            'azul': '#0000FF',
            'verde': '#008000',
            'amarelo': '#FFFF00',
            'rosa': '#FFC0CB',
            'roxo': '#800080',
            'laranja': '#FFA500',
            'marrom': '#8B4513',
            'cinza': '#808080',
            'bege': '#F5F5DC',
            'nude': '#F5DEB3',
            'caramelo': '#D2691E',
            'dourado': '#FFD700',
            'prata': '#C0C0C0',
            'rose gold': '#E8B4B8',
            'natural': '#DEB887'
          }
          
          const hex = colorMap[colorName.toLowerCase()] || '#CCCCCC'
          colors.push({ name: colorName, hex })
        })
      }
    })
  }

  const baseImageUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const extractImageUrl = (image: any): string | null => {
    if (!image) {
      return null
    }

    if (typeof image === 'string') {
      return image.startsWith('http') ? image : `${baseImageUrl}${image}`
    }

    if (typeof image === 'object') {
      const urlCandidate = image.url ?? image.path ?? image.src ?? image.location
      if (typeof urlCandidate === 'string' && urlCandidate.length > 0) {
        return urlCandidate.startsWith('http')
          ? urlCandidate
          : `${baseImageUrl}${urlCandidate}`
      }
    }

    return null
  }

  const imageEntries = Array.isArray(backendProduct.images)
    ? [...backendProduct.images]
    : []

  imageEntries.sort((a: any, b: any) => {
    const aMain = typeof a === 'object' && !!a?.isMain
    const bMain = typeof b === 'object' && !!b?.isMain
    if (aMain === bMain) {
      return 0
    }
    return aMain ? -1 : 1
  })

  const images =
    imageEntries
      .map(extractImageUrl)
      .filter((url): url is string => typeof url === 'string')
      .filter((url, index, self) => url && self.indexOf(url) === index)

  if (!images || images.length === 0) {
    images.push('/placeholder.svg?height=500&width=500')
  }

  const categoryEntity = backendProduct.categoryEntity ?? null
  const normalizedCategoryId =
    backendProduct.categoryId ?? categoryEntity?.id ?? undefined
  const normalizedCategoryName =
    categoryEntity?.name ?? backendProduct.category ?? undefined

  return {
    id: backendProduct.id,
    name: backendProduct.name,
    description: backendProduct.description || '',
    price: parseFloat(backendProduct.price),
    wholesalePrice: backendProduct.wholesalePrice ? parseFloat(backendProduct.wholesalePrice) : undefined,
    reference: backendProduct.sku || `REF${backendProduct.id}`,
    sku: backendProduct.sku,
    category: normalizedCategoryName,
    categoryId: normalizedCategoryId,
    images,
    sizes: sizes.length > 0 ? sizes : undefined,
    colors: colors.length > 0 ? colors : undefined,
    stock: backendProduct.stock,
    status: backendProduct.status,
    weight: backendProduct.weight,
    dimensions: backendProduct.dimensions,
    youtubeUrl: backendProduct.youtubeUrl,
    variations: backendProduct.variations,
    isFavorite: backendProduct.isFavorite || false
  }
}
