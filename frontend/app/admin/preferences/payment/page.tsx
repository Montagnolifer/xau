"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Loader2, 
  CheckCircle2, 
  Info,
  ExternalLink,
  Shield,
  Lock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PaymentSettingsPage() {
  const { toast } = useToast()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados para configurações do Mercado Pago
  const [publicKey, setPublicKey] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [environment, setEnvironment] = useState<"test" | "production">("test")
  
  const handleSave = async () => {
    if (!isEnabled) {
      toast({
        title: "Configuração salva",
        description: "Pagamento desabilitado com sucesso.",
      })
      return
    }

    // Validações básicas
    if (!publicKey.trim()) {
      toast({
        title: "Erro",
        description: "A chave pública é obrigatória.",
        variant: "destructive",
      })
      return
    }

    if (!accessToken.trim()) {
      toast({
        title: "Erro",
        description: "O token de acesso é obrigatório.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    
    try {
      // TODO: Implementar chamada à API para salvar configurações
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulação
      
      toast({
        title: "Configuração salva",
        description: "As configurações de pagamento foram salvas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações de Pagamento</h1>
        <p className="text-slate-600 mt-1">
          Configure os métodos de pagamento para seus pedidos
        </p>
      </div>

      {/* Card principal de configuração */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Pagamento Online</CardTitle>
                <CardDescription>
                  Habilite pagamentos online usando Mercado Pago Checkout Bricks
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!isEnabled ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <CreditCard className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Pagamento desabilitado
              </h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Os pedidos serão processados apenas via WhatsApp. 
                Habilite o pagamento online para permitir que clientes paguem diretamente no site.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informações sobre tipos de pedido */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Tipos de Pedido
                    </h4>
                    <p className="text-sm text-blue-800">
                      Com o pagamento habilitado, você terá dois tipos de pedidos:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-800">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        <strong>Pedido via WhatsApp:</strong> Cliente finaliza pelo WhatsApp (sem pagamento online)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        <strong>Pedido com Pagamento:</strong> Cliente paga diretamente no site usando Mercado Pago
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Configurações do Mercado Pago */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Configurações do Mercado Pago
                      </h3>
                      <p className="text-sm text-slate-600">
                        Configure suas credenciais para usar o Checkout Bricks
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pl-14">
                    {/* Ambiente */}
                    <div className="space-y-2">
                      <Label htmlFor="environment" className="text-slate-700">
                        Ambiente
                      </Label>
                      <Select value={environment} onValueChange={(value: "test" | "production") => setEnvironment(value)}>
                        <SelectTrigger id="environment" className="border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="test">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Teste
                              </Badge>
                              <span>Ambiente de Testes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="production">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                Produção
                              </Badge>
                              <span>Ambiente de Produção</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Use o ambiente de teste para validar a integração antes de ir para produção
                      </p>
                    </div>

                    {/* Public Key */}
                    <div className="space-y-2">
                      <Label htmlFor="publicKey" className="text-slate-700">
                        Chave Pública (Public Key) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="publicKey"
                          type="text"
                          placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={publicKey}
                          onChange={(e) => setPublicKey(e.target.value)}
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        />
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500">
                        Chave pública do Mercado Pago. Encontre em:{" "}
                        <a
                          href="https://www.mercadopago.com.br/developers/panel/credentials"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                        >
                          Credenciais
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>

                    {/* Access Token */}
                    <div className="space-y-2">
                      <Label htmlFor="accessToken" className="text-slate-700">
                        Token de Acesso (Access Token) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="accessToken"
                          type="password"
                          placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        />
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500">
                        Token de acesso privado do Mercado Pago. Mantenha em segurança.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações sobre Checkout Bricks */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">
                        Sobre o Checkout Bricks
                      </h4>
                      <p className="text-sm text-slate-700 mb-3">
                        O Checkout Bricks é uma solução modular do Mercado Pago que permite criar 
                        uma experiência de pagamento personalizada e segura. Com ele, você pode:
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Oferecer múltiplos meios de pagamento (cartão, Pix, boleto, etc.)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Personalizar a interface de acordo com sua marca</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Manter a segurança PCI DSS simplificada</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>Implementar autenticação 3DS 2.0 para maior segurança</span>
                        </li>
                      </ul>
                      <div className="mt-3">
                        <a
                          href="https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/overview"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                        >
                          Saiba mais sobre Checkout Bricks
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de salvar */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
