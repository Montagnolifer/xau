"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Home,
  Package,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Settings,
  ShoppingCart,
  Users,
  ChevronDown,
  Layers,
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { apiClient } from "@/lib/api"
import { Toaster } from "@/components/ui/toaster"

type IconComponent = typeof Home

type NavigationItem =
  | {
      name: string
      href: string
      icon: IconComponent
      isExpandable?: false
    }
  | {
      name: string
      id: string
      icon: IconComponent
      isExpandable: true
      subItems: Array<{ name: string; href: string; icon: IconComponent }>
    }

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [adminName, setAdminName] = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const authStatus = localStorage.getItem("admin_authenticated")
    const name = localStorage.getItem("admin_name")
    const email = localStorage.getItem("admin_email")
    if (authStatus === "true") {
      setIsAuthenticated(true)
      setAdminName(name)
      setAdminEmail(email)
    }
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_name")
    localStorage.removeItem("admin_email")
    setIsAuthenticated(false)
    router.push("/admin/")
  }

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((item) => item !== menuId) : [...prev, menuId],
    )
  }

  const navigation = useMemo<NavigationItem[]>(
    () => [
      { name: "Dashboard", href: "/admin", icon: Home },
      {
        name: "Produtos",
        icon: Package,
        id: "products",
        isExpandable: true,
        subItems: [
          { name: "Listar Produtos", href: "/admin/produtos", icon: Package },
          { name: "Categorias", href: "/admin/category", icon: Layers },
        ],
      },
      { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
      { name: "Clientes", href: "/admin/clientes", icon: Users },
      { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
    ],
    [],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    type ExpandableItem = Extract<NavigationItem, { isExpandable: true }>

    const expandableItems = navigation.filter(
      (item): item is ExpandableItem => item.isExpandable === true,
    )

    const expandedByPath = expandableItems
      .filter((item) => item.subItems.some((subItem) => pathname?.startsWith(subItem.href)))
      .map((item) => item.id)

    setExpandedMenus((prev) => {
      const merged = new Set<string>([...prev, ...expandedByPath])
      return Array.from(merged)
    })
  }, [isAuthenticated, pathname, navigation])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      </Suspense>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Fixed Left */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-slate-200 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-white">AdminPro</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/20"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon

              if ("isExpandable" in item && item.isExpandable) {
                const subItems = item.subItems
                const isExpanded =
                  expandedMenus.includes(item.id) ||
                  subItems.some((subItem) => pathname === subItem.href || pathname?.startsWith(subItem.href))
                return (
                  <div key={item.id} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.id)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <span className="flex items-center">
                        <Icon className="mr-3 h-5 w-5 text-slate-500 group-hover:text-slate-700" />
                        {item.name}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 space-y-1">
                        {subItems.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = pathname === subItem.href
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                isSubActive
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <SubIcon
                                className={`mr-3 h-4 w-4 ${
                                  isSubActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                                }`}
                              />
                              {subItem.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Profile Card */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                  {adminName ? adminName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0,2) : "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{adminName || "Administrador"}</p>
                <p className="text-xs text-slate-500 truncate">{adminEmail || "admin@admin.com"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 lg:ml-72">
        {/* Top navigation - Fixed */}
        <header className="fixed top-0 right-0 left-0 lg:left-72 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Search */}
            <div className="relative flex flex-1 max-w-md">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-400 pl-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Buscar..."
                type="search"
              />
            </div>

            {/* Spacer para empurrar elementos para a direita */}
            <div className="flex-1"></div>

            {/* User actions - alinhados à direita */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User menu */}
              <div className="flex items-center gap-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm font-semibold">AD</AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="pt-16 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toaster para notificações */}
      <Toaster />
    </div>
  )
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const res = await apiClient.loginAdmin(email, password)
      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_token", res.access_token)
      if (res.admin) {
        localStorage.setItem("admin_name", res.admin.name || "Administrador")
        localStorage.setItem("admin_email", res.admin.email || "admin@admin.com")
      }
      onLogin()
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">AdminPro</h2>
          <p className="mt-2 text-sm text-slate-600">Acesse seu painel administrativo</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/25"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-600 text-center font-medium mb-2">Credenciais de demonstração:</p>
            <div className="text-xs text-slate-500 text-center space-y-1">
              <p>
                <span className="font-medium">Email:</span> admin@admin.com
              </p>
              <p>
                <span className="font-medium">Senha:</span> admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
