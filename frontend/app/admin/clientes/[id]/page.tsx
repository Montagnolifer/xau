"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  AlertCircle as AlertCircleIcon,
  Trash2,
  RefreshCw,
  MapPin,
  Search
} from "lucide-react"
import { usersApi, type UserResponse, type UpdateUserRequest } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const userId = params.id as string

  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSearchingCEP, setIsSearchingCEP] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Estados para edição
  const [editedUser, setEditedUser] = useState<UpdateUserRequest>({})

  useEffect(() => {
    if (userId) {
      loadUser()
    }
  }, [userId])

  useEffect(() => {
    // Verificar se há mudanças
    if (user) {
      const hasChanges = 
        editedUser.name !== user.name ||
        editedUser.whatsapp !== user.whatsapp ||
        editedUser.isActive !== user.isActive ||
        editedUser.isWholesale !== user.isWholesale ||
        editedUser.currency !== (user.currency || 'BRL') ||
        editedUser.language !== (user.language || 'pt') ||
        editedUser.address !== (user.address || '') ||
        editedUser.city !== (user.city || '') ||
        editedUser.state !== (user.state || '') ||
        editedUser.zipCode !== (user.zipCode || '') ||
        editedUser.neighborhood !== (user.neighborhood || '') ||
        editedUser.number !== (user.number || '') ||
        editedUser.complement !== (user.complement || '') ||
        editedUser.password !== undefined
      
      setHasChanges(hasChanges)
    }
  }, [editedUser, user])

  const loadUser = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const userData = await usersApi.getUserById(userId)
      setUser(userData)
      setEditedUser({
        name: userData.name,
        whatsapp: userData.whatsapp,
        isActive: userData.isActive,
        isWholesale: userData.isWholesale,
        currency: userData.currency || 'BRL',
        language: userData.language || 'pt',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
        neighborhood: userData.neighborhood || '',
        number: userData.number || '',
        complement: userData.complement || ''
      })
    } catch (err) {
      console.error('Erro ao carregar usuário:', err)
      setError('Erro ao carregar dados do usuário. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      
      // Remover campos vazios
      const updateData: UpdateUserRequest = {}
      if (editedUser.name && editedUser.name !== user.name) {
        updateData.name = editedUser.name
      }
      if (editedUser.whatsapp && editedUser.whatsapp !== user.whatsapp) {
        updateData.whatsapp = editedUser.whatsapp
      }
      if (editedUser.isActive !== user.isActive) {
        updateData.isActive = editedUser.isActive
      }
      if (editedUser.isWholesale !== user.isWholesale) {
        updateData.isWholesale = editedUser.isWholesale
      }
      if (editedUser.currency !== (user.currency || 'BRL')) {
        updateData.currency = editedUser.currency
      }
      if (editedUser.language !== (user.language || 'pt')) {
        updateData.language = editedUser.language
      }
      if (editedUser.address !== (user.address || '')) {
        updateData.address = editedUser.address
      }
      if (editedUser.city !== (user.city || '')) {
        updateData.city = editedUser.city
      }
      if (editedUser.state !== (user.state || '')) {
        updateData.state = editedUser.state
      }
      if (editedUser.zipCode !== (user.zipCode || '')) {
        updateData.zipCode = editedUser.zipCode
      }
      if (editedUser.neighborhood !== (user.neighborhood || '')) {
        updateData.neighborhood = editedUser.neighborhood
      }
      if (editedUser.number !== (user.number || '')) {
        updateData.number = editedUser.number
      }
      if (editedUser.complement !== (user.complement || '')) {
        updateData.complement = editedUser.complement
      }
      if (editedUser.password && editedUser.password.trim() !== '') {
        updateData.password = editedUser.password
      }

      const updatedUser = await usersApi.updateUser(user.id, updateData)
      setUser(updatedUser)
      setEditedUser({
        name: updatedUser.name,
        whatsapp: updatedUser.whatsapp,
        isActive: updatedUser.isActive,
        isWholesale: updatedUser.isWholesale,
        currency: updatedUser.currency || 'BRL',
        language: updatedUser.language || 'pt',
        address: updatedUser.address || '',
        city: updatedUser.city || '',
        state: updatedUser.state || '',
        zipCode: updatedUser.zipCode || '',
        neighborhood: updatedUser.neighborhood || '',
        number: updatedUser.number || '',
        complement: updatedUser.complement || ''
      })

      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
      })
    } catch (err) {
      console.error('Erro ao salvar usuário:', err)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    await loadUser()
  }

  const formatCEP = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara 00000-000
    if (numbers.length <= 5) {
      return numbers
    } else {
      return numbers.slice(0, 5) + '-' + numbers.slice(5, 8)
    }
  }

  const handleCEPChange = (value: string) => {
    const formattedCEP = formatCEP(value)
    setEditedUser({...editedUser, zipCode: formattedCEP})
  }

  const fetchAddressByCEP = async (cep: string) => {
    try {
      setIsSearchingCEP(true)
      
      // Remove hífen e espaços do CEP
      const cleanCEP = cep.replace(/\D/g, '')
      
      // Verifica se o CEP tem 8 dígitos
      if (cleanCEP.length !== 8) {
        toast({
          title: "CEP inválido",
          description: "O CEP deve ter 8 dígitos.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Não foi possível encontrar informações para este CEP.",
          variant: "destructive",
        })
        return
      }

      // Preenche os campos automaticamente
      setEditedUser({
        ...editedUser,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        zipCode: cep
      })

      toast({
        title: "Endereço encontrado",
        description: "Os dados do endereço foram preenchidos automaticamente.",
      })
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível consultar o CEP. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSearchingCEP(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Carregando...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-slate-600">Carregando usuário...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Erro</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Usuário não encontrado'}</p>
            <Button onClick={loadUser} variant="outline">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-slate-600 mt-1">
              Cliente desde {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Ativo" : "Inativo"}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={editedUser.name || user.name}
                onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={editedUser.whatsapp || user.whatsapp}
                onChange={(e) => setEditedUser({...editedUser, whatsapp: e.target.value})}
                className="mt-1"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="password">Nova Senha (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={editedUser.password || ''}
                onChange={(e) => setEditedUser({...editedUser, password: e.target.value})}
                className="mt-1"
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={editedUser.isActive !== undefined ? editedUser.isActive : user.isActive}
                onCheckedChange={(checked) => setEditedUser({...editedUser, isActive: checked})}
              />
              <Label htmlFor="is-active">Usuário Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-wholesale"
                checked={editedUser.isWholesale !== undefined ? editedUser.isWholesale : user.isWholesale}
                onCheckedChange={(checked) => setEditedUser({...editedUser, isWholesale: checked})}
              />
              <Label htmlFor="is-wholesale">Modo Atacado</Label>
            </div>

            <div>
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={editedUser.currency || user.currency || 'BRL'}
                onValueChange={(value) => setEditedUser({...editedUser, currency: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                  <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={editedUser.language || user.language || 'pt'}
                onValueChange={(value) => setEditedUser({...editedUser, language: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="es">Espanhol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-600">ID do Usuário</Label>
              <p className="text-sm text-slate-500 font-mono mt-1">{user.id}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600">Data de Criação</Label>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600">Última Atualização</Label>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(user.updatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {user.lastLoginAt && (
              <div>
                <Label className="text-sm font-medium text-slate-600">Último Login</Label>
                <p className="text-sm text-slate-500 mt-1">
                  {format(new Date(user.lastLoginAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Status</span>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Modo Atacado</span>
                <Badge variant={user.isWholesale ? "default" : "secondary"}>
                  {user.isWholesale ? "Ativado" : "Desativado"}
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Moeda</span>
                <Badge variant="outline">
                  {user.currency === 'USD' ? 'USD' : 'BRL'}
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Idioma</span>
                <Badge variant="outline">
                  {user.language === 'es' ? 'Espanhol' : 'Português'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endereço - Card separado embaixo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={editedUser.address || ''}
              onChange={(e) => setEditedUser({...editedUser, address: e.target.value})}
              className="mt-1"
              placeholder="Rua, Avenida, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={editedUser.number || ''}
                onChange={(e) => setEditedUser({...editedUser, number: e.target.value})}
                className="mt-1"
                placeholder="123"
              />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={editedUser.neighborhood || ''}
                onChange={(e) => setEditedUser({...editedUser, neighborhood: e.target.value})}
                className="mt-1"
                placeholder="Centro"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={editedUser.complement || ''}
              onChange={(e) => setEditedUser({...editedUser, complement: e.target.value})}
              className="mt-1"
              placeholder="Apartamento, casa, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={editedUser.city || ''}
                onChange={(e) => setEditedUser({...editedUser, city: e.target.value})}
                className="mt-1"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={editedUser.state || ''}
                onChange={(e) => setEditedUser({...editedUser, state: e.target.value})}
                className="mt-1"
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="zipCode">CEP</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="zipCode"
                  value={editedUser.zipCode || ''}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  className="flex-1"
                  placeholder="01234-567"
                  maxLength={9}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAddressByCEP(editedUser.zipCode || '')}
                  disabled={!editedUser.zipCode || editedUser.zipCode.replace(/\D/g, '').length !== 8 || isSearchingCEP}
                  className="px-3"
                >
                  {isSearchingCEP ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo das Alterações */}
      {hasChanges && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Alterações Pendentes</span>
            </div>
            <div className="text-sm text-blue-800">
              <p>Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicar as mudanças.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
