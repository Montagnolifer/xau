"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Package,
  TrendingUp,
  AlertTriangle,
  Star,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { config } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import { ImportProductsDialog } from "./components/import-products-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Product {
  id: number
  name: string
  price: number
  wholesalePrice?: number
  category: string
  stock: number
  status: "active" | "inactive"
  image?: string
  sales: number
  trend: "up" | "down" | "stable"
  isFavorite: boolean
  mercadoLivreId?: string | null
}

const resolveProductImage = (product: any): string | undefined => {
  const images = product?.images

  if (!images || (Array.isArray(images) && images.length === 0)) {
    return undefined
  }

  // Novo formato: array de URLs (string)
  if (Array.isArray(images) && typeof images[0] === "string") {
    const url = images[0] as string
    return url.startsWith("http") ? url : `${config.api.baseUrl}${url}`
  }

  // Formato antigo: array de objetos com url/isMain
  if (Array.isArray(images) && typeof images[0] === "object") {
    const mainImage = images.find((img: any) => img?.isMain) ?? images[0]
    if (mainImage?.url) {
      return mainImage.url.startsWith("http") ? mainImage.url : `${config.api.baseUrl}${mainImage.url}`
    }
  }

  return undefined
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalActiveProducts, setTotalActiveProducts] = useState(0)
  const [totalLowStockProducts, setTotalLowStockProducts] = useState(0)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const itemsPerPage = 30
  const { toast } = useToast()

  const loadProducts = async (page: number = currentPage) => {
    // Verificar se há filtros ativos
    const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all"
    setLoading(true)
    setError(null)
    try {
      // Se há filtros ativos, carregar todos os produtos (sem paginação)
      // Caso contrário, usar paginação
      const response = hasActiveFilters
        ? await apiClient.getProducts() // Sem paginação quando há filtros
        : await apiClient.getProducts(page, itemsPerPage) // Com paginação quando não há filtros
      
      // Verificar se é resposta paginada ou array simples (compatibilidade)
      let data: any[]
      let total = 0
      let totalPagesCount = 1
      
      if (response && typeof response === 'object' && 'data' in response && !hasActiveFilters) {
        // Resposta paginada (apenas quando não há filtros)
        data = response.data
        total = response.total
        totalPagesCount = response.totalPages
        setTotalPages(response.totalPages)
        setTotalProducts(response.total)
      } else {
        // Array simples (quando há filtros ou fallback para compatibilidade)
        data = Array.isArray(response) ? response : []
        total = data.length
        totalPagesCount = 1
        setTotalPages(1)
        setTotalProducts(data.length)
      }
      
      const mappedProducts: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        wholesalePrice: p.wholesalePrice,
        category: p.category,
        stock: p.stock,
        status: (p.status ? "active" : "inactive") as "active" | "inactive",
        image: resolveProductImage(p),
        sales: p.sales || 0,
        trend: "stable" as "up" | "down" | "stable",
        isFavorite: p.isFavorite || false,
        mercadoLivreId: p.mercadoLivreId || null,
      }))
      
      // Se há filtros, aplicar filtros no frontend
      let filteredMappedProducts = mappedProducts
      if (hasActiveFilters) {
        filteredMappedProducts = mappedProducts.filter((product) => {
          const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
          
          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && product.status === "active") ||
            (statusFilter === "inactive" && product.status === "inactive")
          
          const matchesCategory =
            categoryFilter === "all" ||
            (categoryFilter === "sem-categoria" 
              ? !product.category || product.category.trim() === "" || product.category === "Sem categoria"
              : product.category === categoryFilter)
          
          return matchesSearch && matchesStatus && matchesCategory
        })
      }
      
      setProducts(filteredMappedProducts)
      
      // Calcular estatísticas dos produtos da página atual
      const activeCount = filteredMappedProducts.filter((p) => p.status === "active").length
      const lowStockCount = filteredMappedProducts.filter((p) => p.stock <= 10 && p.stock > 0).length
      
      // Se não temos dados paginados, usar contagem local
      if (!(response && typeof response === 'object' && 'data' in response && !hasActiveFilters)) {
        setTotalActiveProducts(activeCount)
        setTotalLowStockProducts(lowStockCount)
      }
      
      // Não extrair categorias dos produtos aqui - elas são carregadas separadamente
    } catch (err) {
      setError("Erro ao buscar produtos.")
      console.error('Erro ao carregar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Carregar categorias da API
  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const categories = await apiClient.getCategoriesFlat()
      if (Array.isArray(categories)) {
        // Filtrar apenas categorias ativas e mapear para o nome
        const activeCategoryNames = categories
          .filter((cat) => cat.status !== false)
          .map((cat) => cat.name)
          .sort()
        setAvailableCategories(activeCategoryNames)
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias cadastradas.",
        variant: "destructive",
      })
    } finally {
      setLoadingCategories(false)
    }
  }

  // Carregar estatísticas gerais (sem paginação)
  const loadStats = async () => {
    try {
      const allProducts = await apiClient.getProducts() as any[]
      if (Array.isArray(allProducts)) {
        setTotalProducts(allProducts.length)
        setTotalActiveProducts(allProducts.filter((p: any) => p.status).length)
        setTotalLowStockProducts(allProducts.filter((p: any) => p.stock <= 10 && p.stock > 0).length)
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  // Carregar categorias quando o componente montar
  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all"
    loadProducts(currentPage)
    // Carregar estatísticas apenas quando não há filtros
    if (!hasActiveFilters) {
      loadStats()
    }
  }, [currentPage, searchTerm, statusFilter, categoryFilter])

  // Resetar para página 1 quando filtros mudarem (apenas se não houver filtros)
  useEffect(() => {
    const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all"
    if (!hasActiveFilters && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, statusFilter, categoryFilter])

  // Se não há filtros ativos, os produtos já vêm paginados do backend
  // Se há filtros ativos, os produtos já foram filtrados no loadProducts
  const filteredProducts = products

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-emerald-500" />
      case "down":
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      default:
        return <div className="h-3 w-3 bg-slate-400 rounded-full" />
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "text-red-600", bg: "bg-red-50", text: "Sem estoque" }
    if (stock <= 10) return { color: "text-orange-600", bg: "bg-orange-50", text: "Estoque baixo" }
    return { color: "text-emerald-600", bg: "bg-emerald-50", text: "Em estoque" }
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setDeleting(true)
    setError(null) // Limpar erros anteriores
    
    try {
      const result = await apiClient.deleteProduct(productToDelete.id)
      console.log('Resultado do delete:', result)
      
      // Remove o produto da lista local
      setProducts(prevProducts => {
        const newProducts = prevProducts.filter(p => p.id !== productToDelete.id)
        console.log('Produtos antes:', prevProducts.length, 'Produtos depois:', newProducts.length)
        return newProducts
      })
      
      // Remove o produto da seleção se estiver selecionado
      setSelectedProductIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(productToDelete.id)
        return newSet
      })
      
      // Fechar o modal
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      
      console.log('Produto deletado com sucesso:', productToDelete.id)
      toast({
        title: "Produto deletado com sucesso",
        description: `O produto "${productToDelete.name}" foi deletado com sucesso.`,
      })
      
      // Recarregar a lista para garantir sincronização
      setTimeout(() => {
        loadProducts()
      }, 500)
      
    } catch (err) {
      console.error('Erro ao deletar produto:', err)
      setError("Erro ao deletar produto. Tente novamente.")
      toast({
        title: "Erro ao deletar produto",
        description: "Ocorreu um erro ao deletar o produto. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setProductToDelete(null)
  }

  const handleToggleFavorite = async (product: Product) => {
    try {
      const updatedProduct = await apiClient.toggleFavorite(product.id)
      
      // Atualizar o produto na lista local
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id 
            ? { ...p, isFavorite: updatedProduct.isFavorite }
            : p
        )
      )
      
      toast({
        title: updatedProduct.isFavorite ? "Produto favoritado" : "Produto desfavoritado",
        description: updatedProduct.isFavorite 
          ? `"${product.name}" foi adicionado aos favoritos.`
          : `"${product.name}" foi removido dos favoritos.`,
      })
    } catch (err) {
      console.error('Erro ao favoritar produto:', err)
      toast({
        title: "Erro ao favoritar produto",
        description: "Ocorreu um erro ao favoritar o produto. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Funções de seleção múltipla
  const handleToggleSelection = (productId: number) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const visibleProductIds = filteredProducts.map(p => p.id)
    setSelectedProductIds(prev => {
      const newSet = new Set(prev)
      visibleProductIds.forEach(id => newSet.add(id))
      return newSet
    })
  }

  const handleDeselectAll = () => {
    const visibleProductIds = filteredProducts.map(p => p.id)
    setSelectedProductIds(prev => {
      const newSet = new Set(prev)
      visibleProductIds.forEach(id => newSet.delete(id))
      return newSet
    })
  }

  // Verificar se todos os produtos visíveis estão selecionados
  const areAllVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))
  
  // Contar produtos selecionados visíveis
  const selectedVisibleCount = filteredProducts.filter(p => selectedProductIds.has(p.id)).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Produtos</h1>
          <p className="text-slate-600 mt-1">Gerencie seu catálogo de produtos</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            className="border-slate-300"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar Produtos
          </Button>
          <Link href="/admin/produtos/novo">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Produtos Ativos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalActiveProducts}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalLowStockProducts}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar produtos por nome ou categoria..."
                  className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="border-slate-300">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
            
            {/* Filtros de Status e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de Ações de Seleção */}
      {!loading && filteredProducts.length > 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedProductIds.size > 0 ? (
                  <p className="text-sm font-medium text-slate-700">
                    {selectedProductIds.size} {selectedProductIds.size === 1 ? 'produto selecionado' : 'produtos selecionados'}
                    {selectedVisibleCount !== selectedProductIds.size && (
                      <span className="text-slate-500 ml-1">
                        ({selectedVisibleCount} {selectedVisibleCount === 1 ? 'visível' : 'visíveis'})
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum produto selecionado</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {areAllVisibleSelected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                    onClick={handleDeselectAll}
                  >
                    Deselecionar Todos
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                    onClick={handleSelectAll}
                  >
                    Selecionar Todos
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      {loading && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">Carregando produtos...</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock)

          return (
            <Card
              key={product.id}
              className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  {/* Checkbox de Seleção */}
                  <div className="flex-shrink-0">
                    <Checkbox
                      checked={selectedProductIds.has(product.id)}
                      onCheckedChange={() => handleToggleSelection(product.id)}
                    />
                  </div>
                  
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={product.image ?? "/placeholder.svg"}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{product.name}</h3>
                        <div className="flex items-center space-x-4 mb-3">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                            {product.category}
                          </Badge>
                          <Badge
                            variant={product.status === "active" ? "default" : "secondary"}
                            className={product.status === "active" ? "bg-emerald-100 text-emerald-700" : ""}
                          >
                            {product.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                          {product.mercadoLivreId && (
                            <Badge 
                              variant="outline" 
                              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500 font-semibold"
                              title={`Sincronizado com Mercado Livre (ID: ${product.mercadoLivreId})`}
                            >
                              ML
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Preço</p>
                            <p className="font-semibold text-slate-900">{formatPrice(product.price)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Preço Atacado</p>
                            <p className="font-semibold text-slate-900">
                              {product.wholesalePrice ? formatPrice(product.wholesalePrice) : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Vendas</p>
                            <div className="flex items-center space-x-1">
                              <span className="font-semibold text-slate-900">{product.sales}</span>
                              {getTrendIcon(product.trend)}
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500">Estoque</p>
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                            >
                              {product.stock > 0 ? `${product.stock} un.` : stockStatus.text}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`border-slate-300 ${product.isFavorite ? 'bg-yellow-50 border-yellow-300' : ''}`}
                              onClick={() => handleToggleFavorite(product)}
                            >
                              <Star className={`h-4 w-4 ${product.isFavorite ? 'text-yellow-500 fill-current' : 'text-slate-400'}`} />
                            </Button>
                            <Button variant="outline" size="sm" className="border-slate-300">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Link href={`/admin/produtos/novo?id=${product.id}`}>
                              <Button variant="outline" size="sm" className="border-slate-300">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-slate-300"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-slate-500 mb-6">Tente ajustar sua busca ou adicione novos produtos.</p>
            <Link href="/admin/produtos/novo">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Paginação - mostrar apenas quando não há filtros ativos */}
      {!loading && filteredProducts.length > 0 && totalPages > 1 && searchTerm.trim() === "" && statusFilter === "all" && categoryFilter === "all" && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Mostrar primeira página, última página, página atual e páginas adjacentes
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }
                return null
              })}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modal de Confirmação de Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o produto "{productToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Importação */}
      <ImportProductsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          loadProducts()
        }}
      />
    </div>
  )
}
