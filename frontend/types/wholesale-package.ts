export interface WhiteLabelOption {
  id: number
  name: string
  description: string
  price: number
  icon: string
}

export interface WholesalePackage {
  id: number
  name: string
  description: string
  basePrice: number
  originalPrice?: number
  minimumOrder: number
  category: string
  thumbnailUrl: string
  image?: string
  shoes: number[]
  whiteLabelOptions: WhiteLabelOption[]
  benefits: string[]
  isPopular?: boolean
  color: string
  profitMargin: string
}
