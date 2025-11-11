"use client"

import React from "react"

import { Home, ShoppingBag, MessageCircle, PlayCircle, Package, User, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { config } from "@/lib/config"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"

export default function BottomNavigation() {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const { isAuthenticated } = useAuth()
  const { state } = useCart()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Não renderizar o bottom navigation em páginas do admin
  if (pathname.startsWith('/admin')) {
    return null
  }

  const navItems = [
    {
      name: "Início",
      href: "/",
      icon: Home,
    },
    /*{
      name: "Pacotes",
      href: "/pacotes",
      icon: Package,
    },*/
    {
      name: "Carrinho",
      href: "/cart",
      icon: ShoppingCart,
      badge: state.totalItems > 0 ? state.totalItems : undefined,
    },
    /*{
      name: "Educação",
      href: "/aulas",
      icon: PlayCircle,
    },*/
    {
      name: isAuthenticated ? "Conta" : "Login",
      href: isAuthenticated ? "/account" : "/auth/login",
      icon: User,
    },
  ]

  // Não renderizar até que o componente esteja montado no cliente
  if (!mounted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-50 to-amber-50 border-t-2 border-yellow-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <div key={item.name} className="flex flex-col items-center w-full pt-2">
              <item.icon className="w-6 h-6 mb-1 text-gray-600" />
              <span className="text-xs text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-50 to-amber-50 border-t-2 border-yellow-200 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center w-full pt-2 transition-colors duration-200 relative",
              pathname === item.href
                ? "text-yellow-700"
                : "text-gray-600 hover:text-yellow-600"
            )}
          >
            <div className="relative">
              <item.icon className="w-6 h-6 mb-1" />
              {item.badge && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {item.badge}
                </div>
              )}
            </div>
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
