export interface ShoeVariant {
  size: string
  color: string
  colorHex: string
  stock: number
}

export interface Shoe {
  id: number
  name: string
  description: string
  category: string
  brand: string
  wholesalePrice: number
  retailPrice: number
  minimumOrder: number
  images: string[]
  variants: ShoeVariant[]
  features: string[]
  materials: string[]
  isNewArrival?: boolean
  isBestseller?: boolean
}
