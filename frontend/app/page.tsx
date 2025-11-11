"use client"

import { useState, useEffect } from "react"
import ProductWholesaleCard from "@/components/product-wholesale-card"
import { getProducts } from "@/data/products"
import { getCategories } from "@/data/categories"
import { Toaster } from "@/components/ui/toaster"
import { Crown, Star, Loader2, Search } from "lucide-react"
import type { Product } from "@/types/product"
import Image from "next/image"

interface CategoryOption {
  id: string
  name: string
  slug: string
  rawId: number | null
  parentId: number | null
  depth: number | null
  path: string[] | null
}

const DEFAULT_CATEGORY_OPTION: CategoryOption = {
  id: "all",
  name: "Todos",
  slug: "all",
  rawId: null,
  parentId: null,
  depth: 0,
  path: [],
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([
    DEFAULT_CATEGORY_OPTION,
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getProducts(),
          getCategories(),
        ])
        setProducts(fetchedProducts)

        const mappedCategories: CategoryOption[] = [
          DEFAULT_CATEGORY_OPTION,
          ...fetchedCategories
            .filter((category) => category.status)
            .map((category) => ({
              id: category.id.toString(),
              name: category.name,
              slug: category.slug,
              rawId: category.id,
              parentId:
                typeof (category as any).parentId === "number"
                  ? (category as any).parentId
                  : null,
              depth:
                typeof category.depth === "number" ? category.depth : null,
              path: Array.isArray((category as any).path)
                ? (category as any).path
                : null,
            })),
        ]

        setCategories(mappedCategories)
      } catch (err) {
        console.error('Erro ao carregar produtos:', err)
        setError("Erro ao carregar produtos. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Função para ordenar produtos com favoritos primeiro
  const sortProductsWithFavorites = (productList: Product[]) => {
    return [...productList].sort((a, b) => {
      // Se ambos são favoritos ou ambos não são favoritos, manter ordem original
      if (a.isFavorite === b.isFavorite) {
        return 0
      }
      // Se apenas um é favorito, colocar o favorito primeiro
      return a.isFavorite ? -1 : 1
    })
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const normalizeString = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()

  const selectedCategoryOption = categories.find(
    (category) => category.id === selectedCategory
  )
  const selectedSubcategoryOption =
    selectedSubcategory !== "all"
      ? categories.find((category) => category.id === selectedSubcategory)
      : null

  const primaryCategories = categories.filter(
    (category) =>
      category.id === "all" || (category.depth ?? 0) === 0
  )

  const primaryCategoriesSorted = [
    primaryCategories.find((category) => category.id === "all"),
    ...primaryCategories
      .filter((category) => category.id !== "all")
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  ].filter((category): category is CategoryOption => Boolean(category))

  const selectedCategoryRawId = selectedCategoryOption?.rawId ?? null

  const descendantCategoryIds = new Set<string>()

  if (selectedCategoryRawId !== null) {
    const categoryByRawId = new Map<number, CategoryOption>()
    categories.forEach((category) => {
      if (category.rawId !== null) {
        categoryByRawId.set(category.rawId, category)
      }
    })

    categoryByRawId.forEach((category) => {
      if (category.rawId === selectedCategoryRawId) {
        return
      }

      let currentParentId = category.parentId ?? null

      while (currentParentId !== null) {
        if (currentParentId === selectedCategoryRawId) {
          descendantCategoryIds.add(category.id)
          break
        }

        const parentCategory = categoryByRawId.get(currentParentId)
        if (!parentCategory) {
          break
        }

        currentParentId = parentCategory.parentId ?? null
      }
    })
  }

  const activeSubcategories =
    selectedCategoryRawId !== null
      ? categories
          .filter(
            (category) =>
              category.parentId !== null &&
              category.parentId === selectedCategoryRawId
          )
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      : []

  useEffect(() => {
    if (selectedCategory === "all") {
      if (selectedSubcategory !== "all") {
        setSelectedSubcategory("all")
      }
      return
    }

    if (selectedSubcategory === "all") {
      return
    }

    if (
      selectedCategoryRawId === null ||
      !categories.some(
        (category) =>
          category.parentId === selectedCategoryRawId &&
          category.id === selectedSubcategory
      )
    ) {
      setSelectedSubcategory("all")
    }
  }, [
    categories,
    selectedCategory,
    selectedCategoryRawId,
    selectedSubcategory,
  ])

  const filteredProducts = sortProductsWithFavorites(
    products.filter((product) => {
      const productCategoryId =
        product.categoryId !== undefined && product.categoryId !== null
          ? product.categoryId.toString()
          : null

      const matchMainCategory =
        selectedCategory === "all" ||
        productCategoryId === selectedCategory ||
        (productCategoryId &&
          descendantCategoryIds.has(productCategoryId)) ||
        (product.category &&
          selectedCategoryOption &&
          normalizeString(product.category) ===
            normalizeString(selectedCategoryOption.name)) ||
        (product.category &&
          selectedCategoryOption?.slug &&
          normalizeString(product.category) ===
            normalizeString(selectedCategoryOption.slug))

      if (!matchMainCategory) {
        return false
      }

      const matchSubcategory =
        selectedSubcategory === "all" ||
        productCategoryId === selectedSubcategory ||
        (product.category &&
          selectedSubcategoryOption &&
          normalizeString(product.category) ===
            normalizeString(selectedSubcategoryOption.name)) ||
        (product.category &&
          selectedSubcategoryOption?.slug &&
          normalizeString(product.category) ===
            normalizeString(selectedSubcategoryOption.slug))

      if (!matchSubcategory) {
        return false
      }

      const productName = product.name?.toLowerCase() ?? ""
      const productDescription = product.description?.toLowerCase() ?? ""
      const productReference = product.reference?.toLowerCase() ?? ""

      const matchSearch =
        normalizedSearchTerm.length === 0 ||
        productName.includes(normalizedSearchTerm) ||
        productDescription.includes(normalizedSearchTerm) ||
        productReference.includes(normalizedSearchTerm)

      return matchSearch
    })
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
          Busque por nome, descrição ou referência
          </p>
        </div>

        {/* Busca */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="product-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Digite para encontrar um produto específico"
              className="w-full rounded-full border border-gray-200 bg-white/80 px-10 py-3 text-sm text-gray-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {primaryCategoriesSorted.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id)
                setSelectedSubcategory("all")
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg transform scale-105"
                  : "border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {selectedCategory !== "all" && activeSubcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <button
              onClick={() => setSelectedSubcategory("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                selectedSubcategory === "all"
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
              }`}
            >
              Todas
            </button>
            {activeSubcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => setSelectedSubcategory(subcategory.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  selectedSubcategory === subcategory.id
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
                }`}
              >
                {subcategory.name}
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm md:text-base">
            {selectedSubcategoryOption
              ? `Mostrando subcategoria ${selectedSubcategoryOption.name} — ${filteredProducts.length} ${
                  filteredProducts.length === 1 ? "produto" : "produtos"
                }`
              : `Mostrando categoria ${
                  selectedCategoryOption?.name ?? "Todos"
                } — ${filteredProducts.length} ${
                  filteredProducts.length === 1 ? "produto" : "produtos"
                }`}
          </p>
        </div>

        {/* All Products */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="h-6 w-6 text-brand-primary" />
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === "all"
                ? "Coleção Completa"
                : selectedCategoryOption?.name ?? "Coleção"}
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
