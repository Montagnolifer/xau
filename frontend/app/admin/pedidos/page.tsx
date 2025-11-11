"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Search, Filter, Eye, Package, Clock, CheckCircle, XCircle, AlertCircle, Loader2, CalendarIcon, X, Building2, ShoppingBag } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ordersApi, type OrderResponse } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function OrdersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtro de data
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1) // Primeiro dia do mês atual
  })
  const [dateTo, setDateTo] = useState<Date | undefined>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0) // Último dia do mês atual
  })
  const [showDateFilter, setShowDateFilter] = useState(false)
  
  // Estados para filtros
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const ordersData = await ordersApi.getAllOrders()
      console.log('📊 Orders data:', ordersData)
      console.log('📊 First order totalAmount:', ordersData[0]?.totalAmount, typeof ordersData[0]?.totalAmount)
      setOrders(ordersData)
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
      setError('Erro ao carregar pedidos. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, text: "Concluído" }
      case "processing":
        return { color: "bg-blue-100 text-blue-700", icon: Clock, text: "Processando" }
      case "pending":
        return { color: "bg-orange-100 text-orange-700", icon: AlertCircle, text: "Pendente" }
      case "cancelled":
        return { color: "bg-red-100 text-red-700", icon: XCircle, text: "Cancelado" }
      default:
        return { color: "bg-slate-100 text-slate-700", icon: Package, text: "Desconhecido" }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
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
    
    return dateFrom.getTime() === firstDayOfMonth.getTime() && 
           dateTo.getTime() === lastDayOfMonth.getTime()
  }

  const filteredOrders = orders.filter((order) => {
    // Filtro por texto de busca
    const matchesSearch = searchTerm === "" || 
      order.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por data
    const orderDate = new Date(order.createdAt)
    const matchesDateFrom = !dateFrom || orderDate >= dateFrom
    const matchesDateTo = !dateTo || orderDate <= new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1) // Inclui o dia inteiro
    
    // Filtro por tipo de pedido (atacado/varejo)
    const matchesOrderType = orderTypeFilter === "all" || 
      (orderTypeFilter === "wholesale" && order.user.isWholesale) ||
      (orderTypeFilter === "retail" && !order.user.isWholesale)
    
    // Filtro por status
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesOrderType && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
          <p className="text-slate-600 mt-1">Gerencie todos os pedidos do sistema</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-slate-600">Carregando pedidos...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
          <p className="text-slate-600 mt-1">Gerencie todos os pedidos do sistema</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadOrders} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
        <p className="text-slate-600 mt-1">Gerencie todos os pedidos do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Concluídos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter((o) => o.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Processando</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter((o) => o.status === "processing").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pendentes</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter((o) => o.status === "pending").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Valor Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatPrice(filteredOrders
                    .filter((order) => order.status === 'completed' || order.status === 'processing')
                    .reduce((sum, order) => {
                      const amount = Number(order.totalAmount) || 0
                      console.log('💰 Order amount:', order.totalAmount, 'converted:', amount)
                      return sum + amount
                    }, 0))}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar pedidos por cliente, WhatsApp ou ID..."
                className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros de data */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Data de início */}
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Data inicial
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left border-slate-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data final */}
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Data final
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left border-slate-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col gap-2 sm:justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearDateFilter}
                  className="border-slate-300"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Mês Atual
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

            {/* Filtros de tipo e status */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtro por tipo de pedido */}
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Tipo de Pedido
                </label>
                <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
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

              {/* Filtro por status */}
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Status do Pedido
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Pendente
                      </div>
                    </SelectItem>
                    <SelectItem value="processing">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Processando
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Concluído
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Cancelado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                {searchTerm ? 'Nenhum pedido encontrado' : 'Nenhum pedido cadastrado'}
              </h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca' 
                  : 'Os pedidos aparecerão aqui quando forem criados'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
          const statusConfig = getStatusConfig(order.status)
          const StatusIcon = statusConfig.icon

          return (
            <Card key={order.id} className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-slate-900">#{order.id.substring(0, 8)}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            order.user.isWholesale 
                              ? 'border-purple-200 text-purple-700 bg-purple-50' 
                              : 'border-blue-200 text-blue-700 bg-blue-50'
                          }`}
                        >
                          {order.user.isWholesale ? 'Atacado' : 'Varejo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">
                        {order.user.name || 'Cliente sem nome'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')} • {order.totalItems} pares
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{formatPrice(order.totalAmount)}</p>
                      <Badge className={`${statusConfig.color} border-0 text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.text}
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
          })
        )}
      </div>
    </div>
  )
}
