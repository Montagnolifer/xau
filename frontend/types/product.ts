export interface Color {
  name: string
  hex: string
}

export interface ProductVariation {
  id: number
  name: string
  options: string[]
}

export interface ProductImage {
  id: number
  url: string
  isMain: boolean
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  wholesalePrice?: number // Preço de atacado
  reference?: string // SKU do backend
  sku?: string
  category?: string
  categoryId?: number
  images: string[] | ProductImage[]
  sizes?: string[]
  colors?: Color[]
  // Campos do backend
  stock?: number
  status?: boolean
  weight?: number
  dimensions?: string
  youtubeUrl?: string
  paymentLink?: string
  variations?: ProductVariation[]
  isFavorite?: boolean
}
