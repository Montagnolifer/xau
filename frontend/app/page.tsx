"use client"

import { useState, useEffect } from "react"
import ProductWholesaleCard from "@/components/product-wholesale-card"
import { getProducts } from "@/data/products"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
import { Crown, TrendingUp, Star, Loader2 } from "lucide-react"
import type { Product } from "@/types/product"
import Image from "next/image"

// Interface para as categorias
interface Category {
  id: string
  name: string
  slug: string
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedProducts = await getProducts()
        setProducts(fetchedProducts)
        
        // Extrair categorias únicas dos produtos
        const uniqueCategories = new Map<string, string>()
        fetchedProducts.forEach(product => {
          if (product.category && !uniqueCategories.has(product.category)) {
            uniqueCategories.set(product.category, product.category)
          }
        })
        
        // Criar array de categorias com o botão "Todos"
        const categoriesArray: Category[] = [
          {
            id: "all",
            name: "Todos",
            slug: "all",
          },
          ...Array.from(uniqueCategories.entries()).map(([id, name]) => ({
            id,
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalizar primeira letra
            slug: id,
          }))
        ]
        
        setCategories(categoriesArray)
      } catch (err) {
        console.error('Erro ao carregar produtos:', err)
        setError('Erro ao carregar produtos. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Função para ordenar produtos com favoritos primeiro
  const sortProductsWithFavorites = (productList: Product[]) => {
    return productList.sort((a, b) => {
      // Se ambos são favoritos ou ambos não são favoritos, manter ordem original
      if (a.isFavorite === b.isFavorite) {
        return 0
      }
      // Se apenas um é favorito, colocar o favorito primeiro
      return a.isFavorite ? -1 : 1
    })
  }

  // Filtrar produtos por categoria e ordenar com favoritos primeiro
  const filteredProducts = sortProductsWithFavorites(
    selectedCategory === "all" 
      ? products 
      : products.filter((product) => product.category === selectedCategory)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-brand-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar produtos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg transition-colors bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-sm hover:brightness-110"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-10 w-10 text-brand-primary" />
            <Image 
              src="/logo/logo.png" 
              alt="Emma Santoni" 
              width={200} 
              height={80}
              className="h-20 w-auto"
            />
            <Crown className="h-10 w-10 text-brand-primary" />
          </div>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Cada detalhe pensado para acompanhar o seu ritmo.
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg transform scale-105"
                  : "border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Mostrando {filteredProducts.length} produtos
            {selectedCategory !== "all" && (
              <span className="font-semibold text-brand-primary">
                {" "}
                em {categories.find((c) => c.id === selectedCategory)?.name}
              </span>
            )}
          </p>
        </div>

        {/* All Products */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="h-6 w-6 text-brand-primary" />
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === "all"
                ? "Coleção Completa"
                : categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            {/* Indicador de produtos favoritados */}
            {filteredProducts.some(product => product.isFavorite) && (
              <div className="flex items-center gap-1 bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-sm font-medium">
                <Star className="h-4 w-4 fill-current" />
                <span>Favoritos!</span>
              </div>
            )}
          </div>
          <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductWholesaleCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Crown className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500">Tente selecionar uma categoria diferente</p>
          </div>
        )}
      </div>
      
      {/* Toaster para notificações */}
      <Toaster />
    </div>
  )
}
