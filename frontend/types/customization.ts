export interface Customization {
  id: string
  title: string
  description: string
  price: number
  isActive: boolean
  type: 'text' | 'image' | 'color' | 'select'
  scope: 'product' | 'cart' // Onde a personalização aparece
  options?: string[] // Para tipo 'select'
}

export interface CustomizationOption {
  id: string
  label: string
  value: string
  price?: number // Preço adicional para esta opção específica
}

export interface ProductCustomization {
  customizationId: string
  value: string
  price: number
} 