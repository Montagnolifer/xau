import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  Activity,
} from "lucide-react"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total de Produtos",
      value: "2,847",
      change: "+12.5%",
      changeType: "positive" as const,
      description: "vs. mês anterior",
      icon: Package,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Vendas Hoje",
      value: "R$ 12.847",
      change: "+8.2%",
      changeType: "positive" as const,
      description: "vs. ontem",
      icon: ShoppingCart,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Novos Clientes",
      value: "1,234",
      change: "-2.4%",
      changeType: "negative" as const,
      description: "vs. semana anterior",
      icon: Users,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Taxa de Conversão",
      value: "3.24%",
      change: "+0.8%",
      changeType: "positive" as const,
      description: "vs. mês anterior",
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
    },
  ]

  const recentOrders = [
    { id: "#3847", customer: "João Silva", amount: "R$ 299,90", status: "completed", time: "2 min atrás" },
    { id: "#3846", customer: "Maria Santos", amount: "R$ 1.299,00", status: "processing", time: "5 min atrás" },
    { id: "#3845", customer: "Pedro Costa", amount: "R$ 599,90", status: "completed", time: "12 min atrás" },
    { id: "#3844", customer: "Ana Oliveira", amount: "R$ 899,00", status: "pending", time: "18 min atrás" },
  ]

  const topProducts = [
    { name: "iPhone 15 Pro", sales: 145, revenue: "R$ 217.500", trend: "up" },
    { name: "MacBook Air M2", sales: 89, revenue: "R$ 178.000", trend: "up" },
    { name: "AirPods Pro", sales: 234, revenue: "R$ 58.500", trend: "down" },
    { name: "iPad Air", sales: 67, revenue: "R$ 50.250", trend: "up" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Bem-vindo de volta! Aqui está o resumo do seu negócio.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button variant="outline" className="border-slate-300">
            <Eye className="mr-2 h-4 w-4" />
            Ver Relatório
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const ChangeIcon = stat.changeType === "positive" ? ArrowUpRight : ArrowDownRight

          return (
            <Card key={stat.title} className="relative overflow-hidden border-0 shadow-lg shadow-slate-200/50">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="flex items-center mt-2">
                  <div
                    className={`flex items-center text-sm ${
                      stat.changeType === "positive" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    <ChangeIcon className="h-3 w-3 mr-1" />
                    {stat.change}
                  </div>
                  <span className="text-sm text-slate-500 ml-2">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900">Pedidos Recentes</CardTitle>
                  <CardDescription>Últimas transações do seu negócio</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{order.id}</p>
                        <p className="text-sm text-slate-500">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{order.amount}</p>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "processing"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {order.status === "completed"
                            ? "Concluído"
                            : order.status === "processing"
                              ? "Processando"
                              : "Pendente"}
                        </Badge>
                        <span className="text-xs text-slate-500">{order.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <div>
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-900">Produtos em Destaque</CardTitle>
              <CardDescription>Mais vendidos esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sales} vendas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{product.revenue}</p>
                      <div className="flex items-center justify-end">
                        {product.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6 border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-900">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Ver Clientes
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
