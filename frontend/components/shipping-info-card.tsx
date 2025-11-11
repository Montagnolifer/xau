"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Truck, Edit2, Loader2, Search, Save, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export function ShippingInfoCard() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Estados de controle
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSearchingCEP, setIsSearchingCEP] = useState(false)
  
  // Estado para edição do endereço
  const [editedAddress, setEditedAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    neighborhood: '',
    number: '',
    complement: ''
  })

  // Função para formatar o endereço completo
  const formatAddress = () => {
    if (!user) return null

    const parts: string[] = []
    
    if (user.address) {
      let addressLine = user.address
      if (user.number) {
        addressLine += `, ${user.number}`
      }
      parts.push(addressLine)
    }
    
    if (user.neighborhood) {
      parts.push(user.neighborhood)
    }
    
    if (user.complement) {
      parts.push(user.complement)
    }
    
    const cityState: string[] = []
    if (user.city) {
      cityState.push(user.city)
    }
    if (user.state) {
      cityState.push(user.state)
    }
    if (cityState.length > 0) {
      parts.push(cityState.join(' - '))
    }
    
    if (user.zipCode) {
      parts.push(`CEP: ${user.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}`)
    }
    
    return parts.length > 0 ? parts.join(', ') : null
  }

  const hasCompleteAddress = user?.address && user?.city && user?.state && user?.zipCode && user?.neighborhood

  // useEffect para consulta automática ao carregar se tem CEP mas não endereço completo
  useEffect(() => {
    if (user && user.zipCode && !hasCompleteAddress) {
      // Inicializar campos com dados existentes
      setEditedAddress({
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        neighborhood: user.neighborhood || '',
        number: user.number || '',
        complement: user.complement || ''
      })
      
      // Se tem CEP mas não tem endereço completo, consultar automaticamente
      if (user.zipCode && (!user.address || !user.city || !user.state || !user.neighborhood)) {
        fetchAddressByCEP(user.zipCode)
        setIsEditing(true) // Expandir o card automaticamente
      }
    }
  }, [user])

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) {
      return numbers
    } else {
      return numbers.slice(0, 5) + '-' + numbers.slice(5, 8)
    }
  }

  // Função para consultar CEP
  const fetchAddressByCEP = async (cep: string) => {
    try {
      setIsSearchingCEP(true)
      
      const cleanCEP = cep.replace(/\D/g, '')
      
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
      setEditedAddress(prev => ({
        ...prev,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        zipCode: cep
      }))

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

  // Função para salvar endereço
  const handleSave = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(editedAddress),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar endereço')
      }

      const updatedUser = await response.json()
      
      // Atualizar o contexto de autenticação
      const updatedUserData = {
        ...user,
        ...editedAddress
      }
      
      // Atualizar localStorage
      localStorage.setItem('auth_user', JSON.stringify(updatedUserData))
      
      // Recarregar a página para atualizar o contexto
      window.location.reload()

      toast({
        title: "Endereço salvo",
        description: "Seu endereço foi atualizado com sucesso.",
      })

      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar endereço:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o endereço. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Função para cancelar edição
  const handleCancel = () => {
    setEditedAddress({
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
      neighborhood: user?.neighborhood || '',
      number: user?.number || '',
      complement: user?.complement || ''
    })
    setIsEditing(false)
  }

  // Função para iniciar edição
  const handleEdit = () => {
    setEditedAddress({
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
      neighborhood: user?.neighborhood || '',
      number: user?.number || '',
      complement: user?.complement || ''
    })
    setIsEditing(true)
  }

  // Validação: número é obrigatório
  const isNumberRequired = !editedAddress.number || editedAddress.number.trim() === ''

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Informações de Envio
            </CardTitle>
          </div>
          
          {!isEditing && formatAddress() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {!isEditing ? (
          // Card recolhido - mostrar endereço formatado
          formatAddress() ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {formatAddress()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                {hasCompleteAddress ? (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    Completo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                    Incompleto
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <MapPin className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">Nenhum endereço cadastrado</span>
                <p className="text-xs text-gray-400">Adicione seu endereço para facilitar as entregas</p>
              </div>
              
              <Button
                onClick={handleEdit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Adicionar Endereço
              </Button>
            </div>
          )
        ) : (
          // Card expandido - modo edição
          <div className="space-y-4">
            {/* CEP */}
            <div>
              <Label htmlFor="zipCode">CEP</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="zipCode"
                  value={editedAddress.zipCode}
                  onChange={(e) => {
                    const formatted = formatCEP(e.target.value)
                    setEditedAddress({...editedAddress, zipCode: formatted})
                    // Consultar automaticamente quando tiver 8 dígitos
                    if (formatted.replace(/\D/g, '').length === 8) {
                      fetchAddressByCEP(formatted)
                    }
                  }}
                  className="flex-1"
                  placeholder="01234-567"
                  maxLength={9}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAddressByCEP(editedAddress.zipCode)}
                  disabled={!editedAddress.zipCode || editedAddress.zipCode.replace(/\D/g, '').length !== 8 || isSearchingCEP}
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

            {/* Endereço */}
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={editedAddress.address}
                onChange={(e) => setEditedAddress({...editedAddress, address: e.target.value})}
                className="mt-1"
                placeholder="Rua, Avenida, etc."
              />
            </div>

            {/* Número e Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={editedAddress.number}
                  onChange={(e) => setEditedAddress({...editedAddress, number: e.target.value})}
                  className="mt-1"
                  placeholder="123"
                  required
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={editedAddress.neighborhood}
                  onChange={(e) => setEditedAddress({...editedAddress, neighborhood: e.target.value})}
                  className="mt-1"
                  placeholder="Centro"
                />
              </div>
            </div>

            {/* Complemento */}
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={editedAddress.complement}
                onChange={(e) => setEditedAddress({...editedAddress, complement: e.target.value})}
                className="mt-1"
                placeholder="Apartamento, casa, etc."
              />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={editedAddress.city}
                  onChange={(e) => setEditedAddress({...editedAddress, city: e.target.value})}
                  className="mt-1"
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={editedAddress.state}
                  onChange={(e) => setEditedAddress({...editedAddress, state: e.target.value})}
                  className="mt-1"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isNumberRequired}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Endereço
                  </>
                )}
              </Button>
            </div>

            {/* Aviso sobre número obrigatório */}
            {isNumberRequired && (
              <div className="text-xs text-red-600 text-center">
                * O número é obrigatório para salvar o endereço
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
