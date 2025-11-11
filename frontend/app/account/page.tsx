"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, User, Phone, Shield, LogOut, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)


  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    setIsLoading(true)
    logout()
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-brand-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Button variant="ghost" size="icon" className="text-brand-primary hover:bg-brand-primary/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-10 w-10 text-brand-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Minha conta
            </h1>
            <Crown className="h-10 w-10 text-brand-primary" />
          </div>

          <p className="text-gray-600 text-lg">Gerencie sua conta de atacado</p>
        </div>

        {/* User Info Card */}
        <Card className="border border-brand-primary/20 shadow-xl bg-white mb-6">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-brand-primary/5 rounded-lg">
              <Phone className="h-5 w-5 text-brand-primary" />
              <div>
                <p className="text-sm text-gray-600">WhatsApp</p>
                <p className="font-semibold text-gray-800">{user.whatsapp}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-brand-primary/5 rounded-lg">
              <Shield className="h-5 w-5 text-brand-primary" />
              <div>
                <p className="text-sm text-gray-600">Status da conta</p>
                <p className="font-semibold text-gray-800">
                  {user.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-brand-primary/5 rounded-lg">
              <Crown className="h-5 w-5 text-brand-primary" />
              <div>
                <p className="text-sm text-gray-600">Tipo de conta</p>
                <p className="font-semibold text-gray-800">
                  {user.isWholesale ? "Parceiro de atacado" : "Cliente de varejo"}
                </p>
              </div>
            </div>

            {!user.isWholesale && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="h-5 w-5 text-green-600 flex items-center justify-center">
                  <span className="text-lg">🛒</span>
                </div>
                <div>
                  <p className="text-sm text-green-700 font-semibold">Autorização especial</p>
                  <p className="font-semibold text-green-800">Compra em varejo autorizada</p>
                </div>
              </div>
            )}

            {user.lastLoginAt && (
              <div className="flex items-center gap-3 p-3 bg-brand-primary/5 rounded-lg">
                <div className="h-5 w-5 text-brand-primary flex items-center justify-center">
                  <span className="text-lg">🕒</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Último acesso</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(user.lastLoginAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="border border-brand-primary/20 shadow-xl bg-white">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-800">Ações da conta</h3>
          </CardHeader>

          <CardContent className="space-y-4">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 mb-3 hover:brightness-110">
                Ver produtos
              </Button>
            </Link>

            <Link href="/aulas">
              <Button className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 mb-3 hover:brightness-110">
                Acessar educação
              </Button>
            </Link>

            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="outline"
              className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 font-semibold py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  Saindo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Sair da conta
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="border border-brand-primary/20 shadow-xl bg-white mt-6 mb-6">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-800">Precisar de ajuda?</h3>
          </CardHeader>

          <CardContent>
            <p className="text-gray-600 mb-4">
              Entre em contato com nossa equipe de suporte para quaisquer dúvidas sobre sua conta de atacado.
            </p>
            <a
              href={`https://wa.me/5518920044699?text=Preciso de ajuda com minha conta`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3">
                Suporte via WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Toaster para notificações */}
      <Toaster />
    </div>
  )
} 