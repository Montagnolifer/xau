export interface Service {
  id: number
  name: string
  description: string
  icon: string
}

export interface Package {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  duration: string
  category: string
  thumbnailUrl: string
  image?: string
  services: Service[]
  highlights: string[]
  isPopular?: boolean
  color: string
}
