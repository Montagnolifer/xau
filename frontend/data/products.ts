import type { Product } from "@/types/product"
import { apiClient } from "@/lib/api"
import { transformBackendProduct } from "@/lib/utils"

// Categorias em formato JSON
export const categories = [
  {
    id: "all",
    name: "Todas as Categorias",
    slug: "all",
  },
  {
    id: "rasteiras",
    name: "Rasteiras",
    slug: "rasteiras",
  },
  {
    id: "sandalias",
    name: "Sandálias",
    slug: "sandalias",
  },
]

// Função para buscar produtos da API
export async function getProducts(): Promise<Product[]> {
  try {
    const backendProducts = await apiClient.getProducts()
    return backendProducts.map(transformBackendProduct)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    // Retornar produtos de fallback em caso de erro
    return fallbackProducts
  }
}

// Produtos de fallback para quando a API não estiver disponível
export const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Rasteira Básica Confort",
    description: "Rasteira básica super confortável para o dia a dia, com solado antiderrapante e design moderno.",
    price: 15.9,
    reference: "RST001",
    category: "rasteiras",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    sizes: ["35", "36", "37", "38", "39", "40"],
    colors: [
      { name: "Preto", hex: "#000000" },
      { name: "Nude", hex: "#F5DEB3" },
      { name: "Branco", hex: "#FFFFFF" },
    ],
  },
  {
    id: 2,
    name: "Rasteira Metalizada Premium",
    description: "Rasteira com acabamento metalizado premium, ideal para ocasiões especiais e looks sofisticados.",
    price: 22.9,
    reference: "RST002",
    category: "rasteiras",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    sizes: ["35", "36", "37", "38", "39", "40"],
    colors: [
      { name: "Dourado", hex: "#FFD700" },
      { name: "Prata", hex: "#C0C0C0" },
      { name: "Rose Gold", hex: "#E8B4B8" },
    ],
  },
  {
    id: 3,
    name: "Sandália Plataforma Elegante",
    description: "Sandália com plataforma de 5cm, design elegante e confortável para usar o dia todo.",
    price: 35.9,
    reference: "SND001",
    category: "sandalias",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    sizes: ["35", "36", "37", "38", "39", "40"],
    colors: [
      { name: "Caramelo", hex: "#D2691E" },
      { name: "Preto", hex: "#000000" },
      { name: "Nude", hex: "#F5DEB3" },
    ],
  },
  {
    id: 4,
    name: "Sandália Tiras Cruzadas",
    description: "Sandália moderna com tiras cruzadas, salto baixo de 3cm e design contemporâneo.",
    price: 28.9,
    reference: "SND002",
    category: "sandalias",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    sizes: ["35", "36", "37", "38", "39", "40"],
    colors: [
      { name: "Marrom", hex: "#8B4513" },
      { name: "Preto", hex: "#000000" },
      { name: "Bege", hex: "#F5F5DC" },
    ],
  },
  {
    id: 5,
    name: "Rasteira Trançada Artesanal Rasteira Trançada Artesanal",
    description: "Rasteira com detalhes trançados artesanais, super tendência e confortável para o verão.",
    price: 18.9,
    reference: "RST003",
    category: "rasteiras",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    sizes: ["35", "36", "37", "38", "39", "40"],
    colors: [
      { name: "Natural", hex: "#DEB887" },
      { name: "Marrom", hex: "#8B4513" },
      { name: "Preto", hex: "#000000" },
    ],
  },
  {
    id: 6,
    name: "Sandália Salto Bloco Confort",
    description: "Sandália com salto bloco de 6cm, super confortável e estável para uso prolongado.",
    price: 42.9,
    reference: "SND003",
    category: "sandalias",
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    sizes: ["35", "36", "37", "38", "39", "40"],
    colors: [
      { name: "Nude", hex: "#F5DEB3" },
      { name: "Preto", hex: "#000000" },
      { name: "Vermelho", hex: "#DC143C" },
    ],
  },
]

// Exportar produtos estáticos para compatibilidade (será removido gradualmente)
export const products = fallbackProducts
