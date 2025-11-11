"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Search,
  Package,
  Loader2,
  CalendarIcon,
  X,
  Building2,
  ShoppingBag,
  Users,
  Layers,
  Box,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cartApi, type CartResponse } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price)

export default function AdminCartsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [carts, setCarts] = useState<CartResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [dateTo, setDateTo] = useState<Date | undefined>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
  })
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("all")
  const [expandedCartId, setExpandedCartId] = useState<string | null>(null)

  useEffect(() => {
    void loadCarts()
  }, [])

  const loadCarts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await cartApi.getAllCarts()
      setCarts(data)
    } catch (err) {
      console.error("Erro ao carregar carrinhos:", err)
      setError("Erro ao carregar carrinhos. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearDateFilter = () => {
    const now = new Date()
    setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1))
    setDateTo(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  }

  const isCurrentMonth = () => {
    if (!dateFrom || !dateTo) return false
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return dateFrom.getTime() === firstDayOfMonth.getTime() && dateTo.getTime() === lastDayOfMonth.getTime()
  }

  const filteredCarts = useMemo(() => {
    return carts.filter(cart => {
      const userName = cart.user?.name?.toLowerCase() ?? ""
      const userWhatsapp = cart.user?.whatsapp?.toLowerCase() ?? ""
      const cartId = cart.id.toLowerCase()
      const term = searchTerm.toLowerCase()

      const matchesSearch =
        term === "" || userName.includes(term) || userWhatsapp.includes(term) || cartId.includes(term)

      const referenceDate = new Date(cart.updatedAt ?? cart.createdAt)
      const matchesDateFrom = !dateFrom || referenceDate >= dateFrom
      const matchesDateTo =
        !dateTo || referenceDate <= new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1)

      const isWholesale = Boolean(cart.user?.isWholesale)
      const matchesCustomerType =
        customerTypeFilter === "all" ||
        (customerTypeFilter === "wholesale" && isWholesale) ||
        (customerTypeFilter === "retail" && !isWholesale)

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesCustomerType
    })
  }, [carts, searchTerm, dateFrom, dateTo, customerTypeFilter])

  const summary = useMemo(() => {
    const totalCarts = filteredCarts.length
    const totalItems = filteredCarts.reduce((sum, cart) => sum + (Number(cart.totalItems) || 0), 0)
    const totalAmount = filteredCarts.reduce(
      (sum, cart) => sum + (Number(cart.totalAmount) || 0),
      0,
    )
    const wholesaleCount = filteredCarts.filter(cart => cart.user?.isWholesale).length
    const retailCount = totalCarts - wholesaleCount
    const totalProducts = filteredCarts.reduce(
      (sum, cart) => sum + (cart.items?.length ?? 0),
      0,
    )

    return {
      totalCarts,
      totalItems,
      totalAmount,
      wholesaleCount,
      retailCount,
      totalProducts,
    }
  }, [filteredCarts])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Carrinhos</h1>
          <p className="text-slate-600 mt-1">Visualize todos os carrinhos ativos dos clientes</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-slate-600">Carregando carrinhos...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Carrinhos</h1>
          <p className="text-slate-600 mt-1">Visualize todos os carrinhos ativos dos clientes</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadCarts} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Carrinhos</h1>
        <p className="text-slate-600 mt-1">Visualize todos os carrinhos ativos dos clientes</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de carrinhos</p>
                <p className="text-2xl font-bold text-slate-900">{summary.totalCarts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Itens em carrinhos</p>
                <p className="text-2xl font-bold text-slate-900">{summary.totalItems}</p>
              </div>
              <Layers className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Valor total</p>
                <p className="text-2xl font-bold text-slate-900">{formatPrice(summary.totalAmount)}</p>
              </div>
              <Box className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Clientes atacado</p>
                <p className="text-2xl font-bold text-slate-900">{summary.wholesaleCount}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Clientes varejo</p>
                <p className="text-2xl font-bold text-slate-900">{summary.retailCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar carrinhos por cliente, WhatsApp ou ID..."
                className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Data inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left border-slate-300">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Data final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left border-slate-300">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilter}
                  className="border-slate-300"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Mês atual
                </Button>
                {!isCurrentMonth() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom(undefined)
                      setDateTo(undefined)
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Tipo de cliente
                </label>
                <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="wholesale">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        Atacado
                      </div>
                    </SelectItem>
                    <SelectItem value="retail">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                        Varejo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Produtos únicos em carrinhos
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-3">
                  <Layers className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{summary.totalProducts}</p>
                    <p className="text-xs text-slate-500">
                      Quantidade total de produtos distintos nos carrinhos filtrados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredCarts.length === 0 ? (
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                {searchTerm ? "Nenhum carrinho encontrado" : "Nenhum carrinho disponível"}
              </h3>
              <p className="text-slate-500">
                {searchTerm
                  ? "Tente ajustar os termos de busca"
                  : "Os carrinhos aparecerão aqui quando os clientes adicionarem produtos"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCarts.map(cart => {
            const isWholesale = Boolean(cart.user?.isWholesale)
            const isExpanded = expandedCartId === cart.id
            const referenceDate = new Date(cart.updatedAt ?? cart.createdAt)

            return (
              <Card
                key={cart.id}
                className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-slate-900">
                            #{cart.id.substring(0, 8)}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isWholesale
                                ? "border-purple-200 text-purple-700 bg-purple-50"
                                : "border-blue-200 text-blue-700 bg-blue-50"
                            }`}
                          >
                            {isWholesale ? "Atacado" : "Varejo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">
                          {cart.user?.name || "Cliente sem nome"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {cart.user?.whatsapp || "WhatsApp não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <div>
                        <p className="text-xs uppercase text-slate-400">Itens</p>
                        <p className="text-lg font-bold text-slate-900">{cart.totalItems}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Total</p>
                        <p className="text-lg font-bold text-slate-900">
                          {formatPrice(Number(cart.totalAmount) || 0)}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        Atualizado em {format(referenceDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedCartId(isExpanded ? null : cart.id)}
                        className="flex items-center gap-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Esconder itens
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Ver itens
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      {cart.items.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center">
                          Este carrinho está vazio no momento.
                        </p>
                      ) : (
                        cart.items.map(item => {
                          const itemPrice = Number(item.price) || 0
                          const itemQuantity = Number(item.quantity) || 0
                          const totalItemAmount = itemPrice * itemQuantity

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col gap-2 rounded-lg bg-white px-4 py-3 shadow-sm"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Ref: {item.reference || "N/A"} • SKU: {item.sku || "N/A"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {formatPrice(itemPrice)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {itemQuantity} un • {formatPrice(totalItemAmount)}
                                  </p>
                                </div>
                              </div>
                              {(item.selectedSize || item.selectedColor) && (
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                  {item.selectedSize && (
                                    <Badge variant="outline" className="border-slate-200 bg-white">
                                      Tamanho {item.selectedSize}
                                    </Badge>
                                  )}
                                  {item.selectedColor && (
                                    <Badge variant="outline" className="border-slate-200 bg-white">
                                      Cor {item.selectedColor}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
