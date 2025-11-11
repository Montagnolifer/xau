"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Crown, Phone, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface LoginResponse {
  access_token?: string
  user?: {
    id: string
    name: string
    whatsapp: string
    isActive: boolean
    isWholesale: boolean
    lastLoginAt?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    neighborhood?: string
    number?: string
    complement?: string
  }
  message?: string
  error?: string
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    whatsapp: "55",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const whatsappNumber = "5518920044699" // Para componentes client-side

  // Função para formatar o WhatsApp (exibir)
  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Se não tem números, retorna +55
    if (numbers.length === 0) {
      return '+55'
    }
    
    // Se tem menos de 2 dígitos, adiciona +55
    if (numbers.length < 2) {
      return `+55${numbers}`
    }
    
    // Aplica a máscara
    if (numbers.length <= 4) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`
    } else if (numbers.length <= 8) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`
    } else if (numbers.length <= 12) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 8)}-${numbers.slice(8)}`
    } else {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`
    }
  }

  // Função para limpar o WhatsApp (enviar)
  const cleanWhatsApp = (value: string) => {
    return value.replace(/\D/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validar WhatsApp
    const cleanWhatsAppValue = cleanWhatsApp(formData.whatsapp)
    if (cleanWhatsAppValue.length < 10) {
      setErrorMessage("WhatsApp deve ter pelo menos 10 dígitos")
      setIsLoading(false)
      return
    }

    try {
      // Garantir que o WhatsApp seja enviado apenas com números
      const cleanFormData = {
        ...formData,
        whatsapp: cleanWhatsAppValue
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData),
      })

      let data: LoginResponse = {}
      try {
        data = await response.json()
        console.log('Resposta do servidor:', data)
      } catch (e) {
        // Se não for JSON, ignora
        console.log('Erro ao parsear JSON:', e)
      }

      if (response.ok) {
        setErrorMessage("") // Limpar erro anterior
        if (data.access_token && data.user) {
          login(data.access_token, data.user)
          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo, ${data.user.name}!`,
          })
          router.push("/")
        } else {
          const errorMsg = "Resposta inválida do servidor"
          setErrorMessage(errorMsg)
          toast({
            title: "Erro no login",
            description: errorMsg,
            variant: "destructive",
          })
        }
      } else {
        const errorMsg = data.message || data.error || (response.status === 401 ? "Dados incorretos" : "Erro desconhecido")
        setErrorMessage(errorMsg)
        toast({
          title: "Erro no login",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro no login:", error)
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'whatsapp') {
      // Para WhatsApp, remove tudo que não é número
      const cleanValue = cleanWhatsApp(value)
      
      // Se o usuário apagou tudo, mantém vazio (permitindo apagar o +55)
      // Se tem números, garante que comece com 55 se não tiver código do país
      let finalValue = cleanValue
      if (cleanValue.length > 0 && !cleanValue.startsWith('55')) {
        finalValue = '55' + cleanValue
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
    } else {
      // Para outros campos, mantém o comportamento normal
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
    
    // Limpar mensagem de erro quando o usuário começar a digitar
    if (errorMessage) {
      setErrorMessage("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-1">
          <Link href="/" className="inline-block mb-6">
            <Button variant="ghost" size="icon" className="text-yellow-700 hover:bg-yellow-100">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-10 w-10 text-yellow-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text text-transparent">
              Emma Santoni
            </h1>
            <Crown className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-2 border-yellow-200 shadow-xl bg-gradient-to-b from-white to-yellow-50">
          <CardHeader className="text-center pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Bem vindo de volta</h2>
            <p className="text-gray-600">Entre na sua conta</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 font-medium">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* WhatsApp Field */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-gray-700 font-semibold">
                  WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-600" />
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    placeholder="+55 (11) 99999-9999"
                    value={formatWhatsApp(formData.whatsapp)}
                    onChange={handleInputChange}
                    className="pl-10 border-2 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-600" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 border-2 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-600 hover:text-yellow-700"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                >
                  Esqueceu sua senha?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-bold py-3 text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Entrando...
                  </div>
                ) : (
                  <>
                    <Crown className="h-5 w-5 mr-2" />
                    Acesar Portal
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-yellow-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-b from-white to-yellow-50 text-gray-500">
                  Novo em nossa plataforma?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">Junte-se à nossa rede exclusiva de atacado</p>
              <Link href="/auth/register">
                <Button
                  variant="outline"
                  className="w-full border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50 font-bold py-3"
                >
                  Criar Conta Premium
                </Button>
              </Link>
            </div>

            {/* Contact Support */}
            <div className="text-center pt-4 border-t border-yellow-200">
              <p className="text-sm text-gray-600 mb-2">Precisa de ajuda para acessar sua conta?</p>
              <a
                href={`https://wa.me/${cleanWhatsApp(whatsappNumber)}?text=Preciso de ajuda com o login`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 hover:text-yellow-700 font-medium text-sm"
              >
                Entre em contato com o suporte via WhatsApp
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            🔒 Conexão criptografada SSL segura
          </Badge>
        </div>
      </div>
    </div>
  )
}
