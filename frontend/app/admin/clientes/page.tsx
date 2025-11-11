"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Eye, Users, UserPlus, Mail, Phone, AlertCircle, RefreshCw, ShoppingBag, Package, X, Clock } from "lucide-react"
import { apiClient, usersApi } from "@/lib/api"
import { UserResponse } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

// Função utilitária para calcular tempo decorrido
const getTimeAgo = (dateString: string | null | undefined): { text: string; badgeClassName: string } => {
  if (!dateString) {
    return { text: "Nunca", badgeClassName: "bg-red-100 text-red-800 border-red-200" }
  }
  
  const now = new Date()
  const lastAccess = new Date(dateString)
  const diffInMs = now.getTime() - lastAccess.getTime()
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)
  
  let text = ""
  let badgeClassName = ""
  
  if (diffInMinutes < 1) {
    text = "Agora"
    badgeClassName = "bg-green-100 text-green-800 border-green-200"
  } else if (diffInMinutes < 60) {
    text = `${diffInMinutes}min`
    badgeClassName = "bg-green-100 text-green-800 border-green-200"
  } else if (diffInHours < 24) {
    text = `${diffInHours}h`
    badgeClassName = "bg-green-100 text-green-800 border-green-200"
  } else if (diffInDays < 7) {
    text = `${diffInDays}d`
    badgeClassName = "bg-green-100 text-green-800 border-green-200"
  } else if (diffInWeeks < 4) {
    text = `${diffInWeeks}sem`
    badgeClassName = "bg-yellow-100 text-yellow-800 border-yellow-200"
  } else if (diffInMonths < 12) {
    text = `${diffInMonths}mes`
    badgeClassName = "bg-orange-100 text-orange-800 border-orange-200"
  } else {
    text = `${diffInYears}ano`
    badgeClassName = "bg-red-100 text-red-800 border-red-200"
  }
  
  return { text, badgeClassName }
}

export default function CustomersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<UserResponse[]>([])
  const [orderCounts, setOrderCounts] = useState<{ [userId: string]: number }>({})
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingWholesale, setUpdatingWholesale] = useState<string | null>(null)
  
  // Estados dos filtros
  const [wholesaleFilter, setWholesaleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("lastAccess")

  const fetchCustomers = async () => {
    try {
      setError(null)
      const [users, orderCountsData] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getOrderCountsByUsers()
      ])
      
      setCustomers(users)
      
      // Converter array para objeto para acesso mais rápido
      const countsMap: { [userId: string]: number } = {}
      let total = 0
      
      orderCountsData.forEach(item => {
        countsMap[item.userId] = item.count
        total += item.count
      })
      
      setOrderCounts(countsMap)
      setTotalOrders(total)
    } catch (err) {
      console.error('Erro ao buscar clientes:', err)
      setError('Erro ao carregar a lista de clientes. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCustomers()
    setRefreshing(false)
  }

  const toggleWholesaleMode = async (customerId: string, currentStatus: boolean) => {
    try {
      setUpdatingWholesale(customerId)
      
      const updatedUser = await usersApi.updateUser(customerId, {
        isWholesale: !currentStatus
      })

      // Atualizar a lista local
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, isWholesale: !currentStatus }
            : customer
        )
      )

      toast({
        title: "Modo atacado alterado",
        description: `Cliente ${!currentStatus ? 'ativado' : 'desativado'} no modo atacado.`,
      })
    } catch (err) {
      console.error('Erro ao alterar modo atacado:', err)
      toast({
        title: "Erro ao alterar modo atacado",
        description: "Não foi possível alterar o modo atacado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUpdatingWholesale(null)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getOrderCountByUser = (userId: string) => {
    return orderCounts[userId] || 0
  }


  const filteredCustomers = customers
    .filter((customer) => {
      // Filtro de busca por nome ou WhatsApp
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.whatsapp.includes(searchTerm)
      
      // Filtro de atacadista
      const matchesWholesale = 
        wholesaleFilter === "all" ||
        (wholesaleFilter === "wholesale" && customer.isWholesale) ||
        (wholesaleFilter === "common" && !customer.isWholesale)
      
      // Filtro de status ativo/inativo
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && customer.isActive) ||
        (statusFilter === "inactive" && !customer.isActive)
      
      return matchesSearch && matchesWholesale && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "lastAccess":
          // Ordenar por último acesso (mais recente primeiro)
          const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
          const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
          return bTime - aTime
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "orders":
          return getOrderCountByUser(b.id) - getOrderCountByUser(a.id)
        case "language":
          const aLang = (a.language || 'pt').toLowerCase()
          const bLang = (b.language || 'pt').toLowerCase()
          return aLang.localeCompare(bLang)
        default:
          return 0
      }
    })


  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="text-slate-600 mt-1">Gerencie sua base de clientes</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg shadow-slate-200/50">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg shadow-slate-200/50">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-600 mt-1">Gerencie sua base de clientes</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-4 sm:mt-0"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-slate-900">{customers.filter(c => c.isActive).length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Usuários Atacadistas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {customers.filter(c => c.isWholesale).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AT</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
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
                placeholder="Buscar clientes por nome ou WhatsApp..."
                className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Tipo de Cliente
                </label>
                <Select value={wholesaleFilter} onValueChange={setWholesaleFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="wholesale">Atacadistas</SelectItem>
                    <SelectItem value="common">Perfil Comum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Ordenar por
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Selecionar ordenação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="lastAccess">Último Acesso</SelectItem>
                    <SelectItem value="createdAt">Data de Cadastro</SelectItem>
                    <SelectItem value="orders">Número de Pedidos</SelectItem>
                    <SelectItem value="language">Idioma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("")
                    setWholesaleFilter("all")
                    setStatusFilter("all")
                    setSortBy("lastAccess")
                  }}
                  className="border-slate-300"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Ativos */}
      {(searchTerm || wholesaleFilter !== "all" || statusFilter !== "all" || sortBy !== "lastAccess") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Filtros ativos:</span>
          
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Busca: "{searchTerm}"
              <button
                onClick={() => setSearchTerm("")}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {wholesaleFilter !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {wholesaleFilter === "wholesale" ? "Atacadistas" : "Perfil Comum"}
              <button
                onClick={() => setWholesaleFilter("all")}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {statusFilter === "active" ? "Ativos" : "Inativos"}
              <button
                onClick={() => setStatusFilter("all")}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {sortBy !== "lastAccess" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Ordenado por: {
                sortBy === "name" ? "Nome" :
                sortBy === "createdAt" ? "Data de Cadastro" :
                sortBy === "orders" ? "Número de Pedidos" :
                sortBy === "language" ? "Idioma" :
                "Último Acesso"
              }
              <button
                onClick={() => setSortBy("lastAccess")}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          <span className="text-sm text-slate-500 ml-2">
            {filteredCustomers.length} de {customers.length} clientes
          </span>
        </div>
      )}

      {/* Customers List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </h3>
              <p className="text-slate-600">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca' 
                  : 'Os clientes aparecerão aqui quando se cadastrarem'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="border-0 shadow-lg shadow-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{customer.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{customer.name}</h3>
                      <div className="flex items-center space-x-2 text-sm flex-wrap gap-1">
                        <div className="flex items-center text-slate-500">
                          <Phone className="w-4 h-4 mr-1" />
                          {customer.whatsapp}
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100/80 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {getOrderCountByUser(customer.id)} pedido{getOrderCountByUser(customer.id) !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary" className={`${getTimeAgo(customer.lastLoginAt).badgeClassName} hover:opacity-80 flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(customer.lastLoginAt).text}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {(customer.language || 'pt').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {customer.currency || 'BRL'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Cliente desde {formatDate(customer.createdAt)}
                        {customer.agreeMarketing && ' • Aceita marketing'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex flex-col items-end space-y-1">
                        <Badge variant={customer.isActive ? "default" : "secondary"} className="hover:bg-inherit hover:text-inherit">
                          {customer.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        {customer.isWholesale && (
                          <Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                            Atacado
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant={customer.isWholesale ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWholesaleMode(customer.id, customer.isWholesale)}
                        disabled={updatingWholesale === customer.id}
                        className={customer.isWholesale ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        {updatingWholesale === customer.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/admin/clientes/${customer.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
