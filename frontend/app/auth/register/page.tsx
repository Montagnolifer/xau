"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Crown, User, Phone, ArrowLeft, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

// Componente que usa useSearchParams
function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "55",
    zipCode: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isWholesale, setIsWholesale] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Detectar parâmetro resale=true na URL
  useEffect(() => {
    const resaleParam = searchParams.get('resale')
    if (resaleParam === 'true') {
      setIsWholesale(true)
    }
  }, [searchParams])

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

  // Função para formatar o CEP (exibir)
  const formatZipCode = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara 00000-000
    if (numbers.length <= 5) {
      return numbers
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
    }
  }

  // Função para limpar o CEP (enviar)
  const cleanZipCode = (value: string) => {
    return value.replace(/\D/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar WhatsApp
    const cleanWhatsAppValue = cleanWhatsApp(formData.whatsapp)
    if (cleanWhatsAppValue.length < 10) {
      toast({
        title: "Erro",
        description: "WhatsApp deve ter pelo menos 10 dígitos!",
        variant: "destructive",
      })
      return
    }

    // Validar CEP
    const cleanZipCodeValue = cleanZipCode(formData.zipCode)
    if (cleanZipCodeValue.length !== 8) {
      toast({
        title: "Erro",
        description: "CEP deve ter 8 dígitos!",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem!",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.register({
        name: formData.name,
        whatsapp: cleanWhatsAppValue,
        zipCode: cleanZipCodeValue,
        password: formData.password,
        isWholesale: isWholesale,
      })

      toast({
        title: "Sucesso!",
        description: response.message,
      })

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error) {
      console.error("Erro no registro:", error)
      toast({
        title: "Erro no registro",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
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
    } else if (name === 'zipCode') {
      // Para CEP, remove tudo que não é número e limita a 8 dígitos
      const cleanValue = cleanZipCode(value).slice(0, 8)
      
      setFormData((prev) => ({
        ...prev,
        [name]: cleanValue,
      }))
    } else {
      // Para outros campos, mantém o comportamento normal
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }



  return (
    <div className="min-h-screen bg-brand-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-1">
          <Link href="/" className="inline-block mb-6">
            <Button variant="ghost" size="icon" className="text-brand-primary hover:bg-brand-primary/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-10 w-10 text-brand-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Emma Santoni
            </h1>
            <Crown className="h-10 w-10 text-brand-primary" />
          </div>
        </div>

        {/* Register Form */}
        <Card className="border border-brand-primary/20 shadow-xl bg-white">
          <CardHeader className="text-center pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Criar uma conta</h2>
            <p className="text-gray-600">Junte-se à nossa rede atacadista premium</p>
            {isWholesale && (
              <Badge className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold mt-2">
                <Crown className="h-4 w-4 mr-1" />
                Cadastro Atacadista
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-primary" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 border border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* WhatsApp Field */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-gray-700 font-semibold">
                  Número do WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-primary" />
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    placeholder="+55 (11) 99999-9999"
                    value={formatWhatsApp(formData.whatsapp)}
                    onChange={handleInputChange}
                    className="pl-10 border border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* CEP Field */}
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-gray-700 font-semibold">
                  CEP
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-primary" />
                  <Input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    placeholder="00000-000"
                    value={formatZipCode(formData.zipCode)}
                    onChange={handleInputChange}
                    className="pl-10 border border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary"
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
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="border border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">
                  Confirme sua senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="border border-brand-primary/20 focus:border-brand-primary focus:ring-brand-primary"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </div>



              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Criar sua Conta...
                  </div>
                ) : (
                  "Criar sua Conta"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-600">
                  Já tem uma conta?{" "}
                <Link href="/auth/login" className="text-brand-primary hover:text-brand-secondary font-semibold underline">
                  Entre aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Componente principal que envolve RegisterForm em Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-1">
            <Link href="/" className="inline-block mb-6">
              <Button variant="ghost" size="icon" className="text-brand-primary hover:bg-brand-primary/10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="h-10 w-10 text-brand-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Emma Santoni
              </h1>
              <Crown className="h-10 w-10 text-brand-primary" />
            </div>
          </div>
          <Card className="border border-brand-primary/20 shadow-xl bg-white">
            <CardContent className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
