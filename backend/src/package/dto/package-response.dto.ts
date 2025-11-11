export class PackageResponseDto {
  id: number
  name: string
  description: string
  category: string
  originalPrice: number
  currentPrice: number
  deliveryTime: string
  image?: string
  status: boolean
  highlights: string[]
  services: Array<{ name: string; description: string }>
  createdAt: Date
  updatedAt: Date
} 