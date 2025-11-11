"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Save, 
  Package, 
  User, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Loader2,
  AlertCircle as AlertCircleIcon,
  Trash2,
  Printer,
  Settings
} from "lucide-react"
import { ordersApi, usersApi, type OrderResponse, type UpdateOrderRequest, type AdditionalCost, type UserResponse } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Estados para edição
  const [editedOrder, setEditedOrder] = useState<UpdateOrderRequest>({})
  const [editedProducts, setEditedProducts] = useState<any[]>([])
  const [editedAdditionalCosts, setEditedAdditionalCosts] = useState<AdditionalCost[]>([])
  
  // Estados para usuários
  const [users, setUsers] = useState<UserResponse[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    if (orderId) {
      loadOrder()
      loadUsers()
    }
  }, [orderId])

  useEffect(() => {
    // Verificar se há mudanças
    if (order) {
      const hasChanges = 
        editedOrder.status !== order.status ||
        editedOrder.notes !== order.notes ||
        editedOrder.whatsappSent !== order.whatsappSent ||
        editedOrder.userName !== order.user.name ||
        editedOrder.userId !== order.user.id ||
        JSON.stringify(editedProducts) !== JSON.stringify(order.products) ||
        JSON.stringify(editedAdditionalCosts) !== JSON.stringify(order.additionalCosts || [])
      
      setHasChanges(hasChanges)
    }
  }, [editedOrder, editedProducts, editedAdditionalCosts, order])

  const loadOrder = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const orderData = await ordersApi.getOrderById(orderId)
      setOrder(orderData)
      setEditedProducts([...orderData.products])
      setEditedAdditionalCosts([...(orderData.additionalCosts || [])])
      setEditedOrder({
        status: orderData.status,
        notes: orderData.notes || '',
        whatsappSent: orderData.whatsappSent,
        totalAmount: orderData.totalAmount,
        totalItems: orderData.totalItems,
        userName: orderData.user.name,
        userId: orderData.user.id
      })
    } catch (err) {
      console.error('Erro ao carregar pedido:', err)
      setError('Erro ao carregar pedido. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const usersData = await usersApi.getUsers()
      setUsers(usersData)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, text: "Concluído" }
      case "processing":
        return { color: "bg-blue-100 text-blue-700", icon: Clock, text: "Processando" }
      case "pending":
        return { color: "bg-orange-100 text-orange-700", icon: AlertCircle, text: "Pendente" }
      case "cancelled":
        return { color: "bg-red-100 text-red-700", icon: XCircle, text: "Cancelado" }
      default:
        return { color: "bg-slate-100 text-slate-700", icon: Package, text: "Desconhecido" }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const handleSave = async () => {
    if (!order) return

    try {
      setIsSaving(true)
      
      const productsTotal = editedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0)
      const additionalCostsTotal = editedAdditionalCosts.reduce((sum, cost) => sum + cost.amount, 0)
      
      // Garantir que todos os produtos tenham productId
      const productsWithIds = editedProducts.map((product, index) => ({
        ...product,
        productId: product.productId || `temp-${Date.now()}-${index}`
      }));

      // Garantir que todos os custos adicionais tenham IDs válidos
      const costsWithIds = editedAdditionalCosts.map((cost, index) => ({
        ...cost,
        id: cost.id || `temp-cost-${Date.now()}-${index}`
      }));

      const updateData: UpdateOrderRequest = {
        ...editedOrder,
        products: productsWithIds,
        additionalCosts: costsWithIds,
        totalAmount: productsTotal + additionalCostsTotal,
        totalItems: editedProducts.reduce((sum, product) => sum + product.quantity, 0),
        userName: editedOrder.userName
      }

      console.log('📤 Sending update data:', JSON.stringify(updateData, null, 2));
      console.log('📦 Products being sent:', productsWithIds);
      console.log('💰 Additional costs being sent:', costsWithIds);
      
      // Log each product individually
      productsWithIds.forEach((product, index) => {
        console.log(`📦 Product ${index}:`, {
          productId: product.productId,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: product.quantity,
          selectedSize: product.selectedSize,
          selectedColor: product.selectedColor,
          imageUrl: product.imageUrl
        });
        
        // Verificar se productId está presente
        if (!product.productId) {
          console.error(`❌ Product ${index} missing productId:`, product);
        }
      });
      
      // Log each additional cost individually
      costsWithIds.forEach((cost, index) => {
        console.log(`💰 Additional cost ${index}:`, {
          id: cost.id,
          name: cost.name,
          description: cost.description,
          amount: cost.amount,
          type: cost.type
        });
      });
      
      // Log the final update data structure
      console.log('📤 Final update data structure:', {
        products: updateData.products?.length || 0,
        additionalCosts: updateData.additionalCosts?.length || 0,
        totalAmount: updateData.totalAmount,
        totalItems: updateData.totalItems,
        status: updateData.status,
        notes: updateData.notes,
        whatsappSent: updateData.whatsappSent,
        userName: updateData.userName
      });
      
      // Log the products and costs with IDs
      console.log('📦 Products with IDs:', productsWithIds);
      console.log('💰 Costs with IDs:', costsWithIds);
      
      // Log the raw JSON that will be sent
      console.log('📤 Raw JSON being sent:', JSON.stringify(updateData));
      
      // Log the data types
      console.log('📤 Data types:', {
        products: typeof updateData.products,
        additionalCosts: typeof updateData.additionalCosts,
        totalAmount: typeof updateData.totalAmount,
        totalItems: typeof updateData.totalItems,
        status: typeof updateData.status,
        notes: typeof updateData.notes,
        whatsappSent: typeof updateData.whatsappSent,
        userName: typeof updateData.userName
      });
      
      // Log validation checks
      console.log('✅ Validation checks:');
      console.log('- Products have productId:', productsWithIds.every(p => p.productId));
      console.log('- Costs have id:', costsWithIds.every(c => c.id));
      console.log('- All products have name:', productsWithIds.every(p => p.name));
      console.log('- All products have price:', productsWithIds.every(p => typeof p.price === 'number'));
      console.log('- All products have quantity:', productsWithIds.every(p => typeof p.quantity === 'number'));
      console.log('- All costs have name:', costsWithIds.every(c => c.name));
      console.log('- All costs have amount:', costsWithIds.every(c => typeof c.amount === 'number'));
      console.log('- All costs have type:', costsWithIds.every(c => c.type));
      
      // Log any validation failures
      const productValidationFailures = productsWithIds.filter(p => !p.productId || !p.name || typeof p.price !== 'number' || typeof p.quantity !== 'number');
      const costValidationFailures = costsWithIds.filter(c => !c.id || !c.name || typeof c.amount !== 'number' || !c.type);
      
      if (productValidationFailures.length > 0) {
        console.error('❌ Product validation failures:', productValidationFailures);
      }
      if (costValidationFailures.length > 0) {
        console.error('❌ Cost validation failures:', costValidationFailures);
      }
      
      // Log the final data being sent
      console.log('📤 Final data being sent to API:', {
        products: productsWithIds,
        additionalCosts: costsWithIds,
        totalAmount: updateData.totalAmount,
        totalItems: updateData.totalItems,
        status: updateData.status,
        notes: updateData.notes,
        whatsappSent: updateData.whatsappSent,
        userName: updateData.userName
      });

      const updatedOrder = await ordersApi.updateOrder(order.id, updateData)
      setOrder(updatedOrder)
      setEditedProducts([...updatedOrder.products])
      setEditedAdditionalCosts([...(updatedOrder.additionalCosts || [])])
      setEditedOrder({
        status: updatedOrder.status,
        notes: updatedOrder.notes || '',
        whatsappSent: updatedOrder.whatsappSent,
        totalAmount: updatedOrder.totalAmount,
        totalItems: updatedOrder.totalItems,
        userName: updatedOrder.user.name
      })

      toast({
        title: "Pedido atualizado",
        description: "As alterações foram salvas com sucesso.",
      })
    } catch (err) {
      console.error('Erro ao salvar pedido:', err)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return

    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setIsDeleting(true)
      await ordersApi.deleteOrder(order.id)
      
      toast({
        title: "Pedido excluído",
        description: "O pedido foi excluído com sucesso.",
      })
      
      router.push('/admin/pedidos')
    } catch (err) {
      console.error('Erro ao excluir pedido:', err)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o pedido. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...editedProducts]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setEditedProducts(newProducts)
  }

  const removeProduct = (index: number) => {
    const newProducts = editedProducts.filter((_, i) => i !== index)
    setEditedProducts(newProducts)
  }

  const addAdditionalCost = () => {
    const newCost: AdditionalCost = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      amount: 0,
      type: 'other'
    }
    setEditedAdditionalCosts([...editedAdditionalCosts, newCost])
  }

  const updateAdditionalCost = (index: number, field: string, value: any) => {
    const newCosts = [...editedAdditionalCosts]
    newCosts[index] = { ...newCosts[index], [field]: value }
    
    // Se mudou o tipo, atualizar o nome automaticamente
    if (field === 'type') {
      if (value === 'other') {
        newCosts[index].name = '' // Limpar para permitir entrada manual
      } else {
        const typeNames = {
          personalization: 'Personalização',
          shipping: 'Frete',
          box: 'Caixa'
        }
        newCosts[index].name = typeNames[value as keyof typeof typeNames] || ''
      }
    }
    
    setEditedAdditionalCosts(newCosts)
  }

  const removeAdditionalCost = (index: number) => {
    const newCosts = editedAdditionalCosts.filter((_, i) => i !== index)
    setEditedAdditionalCosts(newCosts)
  }

  const getCostTypeLabel = (cost: AdditionalCost) => {
    if (cost.type === 'other' && cost.name) {
      return cost.name
    }
    
    switch (cost.type) {
      case 'personalization': return 'Personalização'
      case 'shipping': return 'Frete'
      case 'box': return 'Caixa'
      case 'other': return 'Outro'
      default: return 'Outro'
    }
  }

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId)
    if (selectedUser) {
      setEditedOrder({
        ...editedOrder,
        userId: userId,
        userName: selectedUser.name
      })
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
            <span className="text-slate-600">Carregando pedido...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
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
            <p className="text-red-600 mb-4">{error || 'Pedido não encontrado'}</p>
            <Button onClick={loadOrder} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

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
            <h1 className="text-3xl font-bold text-slate-900">Pedido #{order.id.substring(0, 8)}</h1>
            <p className="text-slate-600 mt-1">
              Criado em {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.color} border-0`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.text}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/admin/pedidos/${order.id}/imprimir`, '_blank')}
          >
            <Printer className="h-4 w-4 mr-2" />
            Orçamento
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/admin/pedidos/${order.id}/production`, '_blank')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Produção
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
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informações do Cliente */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-600">Cliente</Label>
              <Select 
                value={editedOrder.userId || order.user.id} 
                onValueChange={handleUserChange}
                disabled={isLoadingUsers}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingUsers && (
                <p className="text-sm text-slate-500 mt-1">Carregando usuários...</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Nome</Label>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {editedOrder.userName || order.user.name}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">WhatsApp</Label>
              <p className="text-lg font-semibold text-slate-900">
                {editedOrder.userId && editedOrder.userId !== order.user.id 
                  ? users.find(u => u.id === editedOrder.userId)?.whatsapp || order.user.whatsapp
                  : order.user.whatsapp
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">ID do Cliente</Label>
              <p className="text-sm text-slate-500 font-mono">
                {editedOrder.userId || order.user.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Pedido */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Configurações do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editedOrder.status || order.status} 
                  onValueChange={(value) => setEditedOrder({...editedOrder, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="whatsapp-sent"
                  checked={editedOrder.whatsappSent !== undefined ? editedOrder.whatsappSent : order.whatsappSent}
                  onCheckedChange={(checked) => setEditedOrder({...editedOrder, whatsappSent: checked})}
                />
                <Label htmlFor="whatsapp-sent">WhatsApp Enviado</Label>
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre o pedido..."
                value={editedOrder.notes || order.notes || ''}
                onChange={(e) => setEditedOrder({...editedOrder, notes: e.target.value})}
                rows={3}
              />
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-slate-600">Total de Itens</Label>
                <p className="text-2xl font-bold text-slate-900">
                  {editedProducts.reduce((sum, product) => sum + product.quantity, 0)} pares
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">Produtos</Label>
                <p className="text-lg font-semibold text-slate-900">
                  {formatPrice(editedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0))}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">Valor Total</Label>
                <p className="text-2xl font-bold text-slate-900">
                  {formatPrice(
                    editedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0) +
                    editedAdditionalCosts.reduce((sum, cost) => sum + cost.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos do Pedido ({editedProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editedProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum produto no pedido</p>
            </div>
          ) : (
            <div className="space-y-4">
              {editedProducts.map((product, index) => (
                <Card key={index} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Imagem do Produto */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name || 'Produto'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}>
                            <Package className="h-10 w-10 text-slate-400" />
                          </div>
                        </div>
                      </div>

                      {/* Campos do Produto */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Nome do Produto */}
                      <div className="md:col-span-3">
                        <Label className="text-sm font-medium text-slate-600">Produto</Label>
                        <Input
                          value={product.name || ''}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      {/* SKU */}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-600">SKU</Label>
                        <Input
                          value={product.sku || ''}
                          onChange={(e) => updateProduct(index, 'sku', e.target.value)}
                          className="mt-1"
                          placeholder="Ex: TEN-001"
                        />
                      </div>

                      {/* Quantidade */}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-600">Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity || 1}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>

                      {/* Preço */}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-600">Preço Unit.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={product.price || 0}
                          onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="md:col-span-3">
                        <Label className="text-sm font-medium text-slate-600">Subtotal</Label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">
                          {formatPrice((product.price || 0) * (product.quantity || 1))}
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Variações */}
                      {(product.selectedSize || product.selectedColor) && (
                        <div className="md:col-span-12 mt-3 pt-3 border-t border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-slate-600">Tamanho</Label>
                              <Input
                                value={product.selectedSize || ''}
                                onChange={(e) => updateProduct(index, 'selectedSize', e.target.value)}
                                className="mt-1"
                                placeholder="Ex: 38"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-600">Cor</Label>
                              <Input
                                value={product.selectedColor || ''}
                                onChange={(e) => updateProduct(index, 'selectedColor', e.target.value)}
                                className="mt-1"
                                placeholder="Ex: Preto"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custos Adicionais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Custos Adicionais ({editedAdditionalCosts.length})
            </CardTitle>
            <Button onClick={addAdditionalCost} size="sm">
              <Package className="h-4 w-4 mr-2" />
              Adicionar Custo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editedAdditionalCosts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Nenhum custo adicional adicionado</p>
              <Button onClick={addAdditionalCost} variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Adicionar Primeiro Custo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {editedAdditionalCosts.map((cost, index) => (
                <Card key={cost.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Tipo */}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-600">Tipo</Label>
                        <Select 
                          value={cost.type} 
                          onValueChange={(value) => updateAdditionalCost(index, 'type', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personalization">Personalização</SelectItem>
                            <SelectItem value="shipping">Frete</SelectItem>
                            <SelectItem value="box">Caixa</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Nome - apenas para tipo "other" */}
                      {cost.type === 'other' && (
                        <div className="md:col-span-3">
                          <Label className="text-sm font-medium text-slate-600">Nome</Label>
                          <Input
                            value={cost.name}
                            onChange={(e) => updateAdditionalCost(index, 'name', e.target.value)}
                            className="mt-1"
                            placeholder="Ex: Taxa de urgência"
                          />
                        </div>
                      )}

                      {/* Descrição */}
                      <div className={cost.type === 'other' ? 'md:col-span-4' : 'md:col-span-7'}>
                        <Label className="text-sm font-medium text-slate-600">Descrição</Label>
                        <Input
                          value={cost.description || ''}
                          onChange={(e) => updateAdditionalCost(index, 'description', e.target.value)}
                          className="mt-1"
                          placeholder={cost.type === 'other' ? "Ex: Taxa aplicada por urgência no pedido" : "Ex: Nome bordado no tênis"}
                        />
                      </div>

                      {/* Valor */}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-600">Valor</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cost.amount}
                          onChange={(e) => updateAdditionalCost(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="0,00"
                        />
                      </div>

                      {/* Ações */}
                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalCost(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Badge do tipo */}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <Badge variant="outline" className="text-xs">
                        {getCostTypeLabel(cost)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Resumo dos Custos Adicionais */}
              {editedAdditionalCosts.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Total dos Custos Adicionais</span>
                      </div>
                      <span className="text-xl font-bold text-blue-900">
                        {formatPrice(editedAdditionalCosts.reduce((sum, cost) => sum + cost.amount, 0))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
