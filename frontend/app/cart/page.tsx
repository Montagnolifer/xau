"use client"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ShoppingCart, 
  Crown, 
  Package, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Send
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { ProductImage } from "@/types/product"
import { ordersApi, type CreateOrderRequest } from "@/lib/api"
import { ShippingInfoCard } from "@/components/shipping-info-card"

export default function CartPage() {
  const { state, isLoading: isCartLoading, isSyncing: isCartSyncing, removeItem, updateQuantity, clearCart, getItemsRemaining, isMinimumOrderMet, isRetailPromotionMet } = useCart()
  const { isAuthenticated, user } = useAuth()
  const [isFinalizing, setIsFinalizing] = useState(false)
  const isBusy = isFinalizing || isCartSyncing

  // Função para determinar o preço correto baseado no tipo de usuário
  const getItemPrice = (product: any) => {
    if (user?.isWholesale && product.wholesalePrice) {
      return product.wholesalePrice // Preço de atacado para usuários de atacado
    }
    return product.price // Preço normal para usuários de varejo
  }

  // ===== INÍCIO DA PROMOÇÃO TEMPORÁRIA - REMOVER APÓS USO =====
  // Função para aplicar desconto promocional no varejo (R$ 59,90 → R$ 49,95)
  const getPromotionalPrice = (product: any) => {
    // Aplicar apenas para usuários de varejo
    if (user?.isWholesale) {
      return getItemPrice(product)
    }

    // Verificar se o produto custa exatamente R$ 59,90
    const originalPrice = getItemPrice(product)
    if (originalPrice !== 59.90) {
      return originalPrice
    }

    // Contar quantos produtos elegíveis (R$ 59,90) existem no carrinho
    const eligibleProducts = state.items.filter(item => getItemPrice(item.product) === 59.90)
    
    // Calcular quantidade total de produtos elegíveis (incluindo quantidades)
    const totalEligibleQuantity = eligibleProducts.reduce((sum, item) => sum + item.quantity, 0)
    
    // Aplicar desconto apenas se houver 2 ou mais unidades de produtos elegíveis
    if (totalEligibleQuantity >= 2) {
      return 49.95 // Preço promocional
    }

    return originalPrice // Manter preço original se não atender critérios
  }
  // ===== FIM DA PROMOÇÃO TEMPORÁRIA =====

  // ===== INÍCIO DA VERIFICAÇÃO DE PROMOÇÃO ATIVA - REMOVER APÓS USO =====
  // Função para verificar se a promoção está ativa e calcular economia
  const getPromotionInfo = () => {
    if (user?.isWholesale) {
      return { isActive: false, savings: 0, eligibleCount: 0 }
    }

    const eligibleProducts = state.items.filter(item => getItemPrice(item.product) === 59.90)
    const totalEligibleQuantity = eligibleProducts.reduce((sum, item) => sum + item.quantity, 0)
    const isActive = totalEligibleQuantity >= 2
    
    if (!isActive) {
      return { isActive: false, savings: 0, eligibleCount: totalEligibleQuantity }
    }

    // Calcular economia total
    const originalTotal = eligibleProducts.reduce((sum, item) => sum + (getItemPrice(item.product) * item.quantity), 0)
    const promotionalTotal = eligibleProducts.reduce((sum, item) => sum + (getPromotionalPrice(item.product) * item.quantity), 0)
    const savings = originalTotal - promotionalTotal

    return { isActive: true, savings, eligibleCount: totalEligibleQuantity }
  }
  // ===== FIM DA VERIFICAÇÃO DE PROMOÇÃO ATIVA =====

  const itemsRemaining = getItemsRemaining()
  const minimumOrderMet = isMinimumOrderMet()
  const retailPromotionMet = isRetailPromotionMet()

  const handleFinalizeOrder = async () => {
    if (!isAuthenticated) {
      // Redirecionar para login
      window.location.href = "/auth/login"
      return
    }

    setIsFinalizing(true)
    
    try {
      console.log('🔍 Iniciando criação do pedido...')
      console.log('🔐 Usuário autenticado:', isAuthenticated)
      console.log('📦 Itens no carrinho:', state.items.length)
      
      // Preparar dados do pedido
      const orderData: CreateOrderRequest = {
        userId: user!.id, // ID do usuário autenticado
        products: state.items.map(item => ({
          productId: item.product.id.toString(),
          name: item.product.name,
          reference: item.product.reference,
          sku: item.product.sku,
          price: getPromotionalPrice(item.product),
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          imageUrl: getImageUrl(item.product.images)
        })),
        totalAmount: state.items.reduce((sum, item) => sum + (getPromotionalPrice(item.product) * item.quantity), 0),
        totalItems: state.totalItems,
        notes: `Pedido criado em ${new Date().toLocaleString('pt-BR')}`
      }

      console.log('📋 Dados do pedido preparados:', orderData)
      
      // Criar pedido no banco de dados
      console.log('🚀 Enviando pedido para API...')
      const createdOrder = await ordersApi.createOrder(orderData)
      console.log('✅ Pedido criado com sucesso:', createdOrder)

      // Marcar WhatsApp como enviado (opcional)
      await ordersApi.markWhatsappSent(createdOrder.id)

      // Criar mensagem do WhatsApp com ID do pedido
      const message = createWhatsAppMessage(createdOrder.id)
      const whatsappNumber = "5518920044699"
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      
      // Abrir WhatsApp
      window.open(whatsappUrl, "_blank")
      
      // Limpar carrinho após sucesso
      await clearCart()
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('Erro ao processar pedido. Tente novamente.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const createWhatsAppMessage = (orderId?: string) => {
    let message = "🛍️ *PEDIDO EMMA SANTONI*\n\n"
    message += "Olá! Gostaria de fazer um pedido no atacado:\n\n"
    
    if (orderId) {
      message += `*ID do Pedido: ${orderId}*\n\n`
    }
    
    // Adicionar informações do cliente
    if (user) {
      message += `*Cliente: ${user.name}*\n`
      if (user.zipCode) {
        message += `*CEP: ${user.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}*\n\n`
      } else {
        message += `*CEP: Não informado*\n\n`
      }
    }
    
    state.items.forEach((item, index) => {
      message += `*${index + 1}. ${item.product.name}*\n`
      message += `   Ref: ${item.product.reference || 'N/A'}\n`
      message += `   Quantidade: ${item.quantity} pares\n`
      if (item.selectedSize) message += `   Tamanho: ${item.selectedSize}\n`
      if (item.selectedColor) message += `   Cor: ${item.selectedColor}\n`
      message += `   Preço: R$ ${getPromotionalPrice(item.product).toFixed(2)}\n\n`
    })
    
    message += `*Total de itens: ${state.totalItems} pares*\n`
    message += `*Valor total: R$ ${state.items.reduce((sum, item) => sum + (getPromotionalPrice(item.product) * item.quantity), 0).toFixed(2)}*\n\n`
    message += "Aguardo o retorno! 🙏"
    
    return message
  }

  const getImageUrl = (images: string[] | ProductImage[]) => {
    if (images.length === 0) return "/placeholder.svg"
    if (typeof images[0] === 'string') {
      return images[0] as string
    }
    return (images[0] as ProductImage).url || "/placeholder.svg"
  }

  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mx-auto" />
          <p className="text-gray-600">Carregando carrinho...</p>
        </div>
      </div>
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ShoppingCart className="h-10 w-10 text-brand-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Carrinho de Compras
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Seu carrinho está vazio. Adicione produtos para começar seu pedido no atacado.
            </p>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <div className="text-gray-400 mb-6">
              <ShoppingCart className="h-24 w-24 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-4">Carrinho Vazio</h3>
            <p className="text-gray-500 mb-8">Adicione produtos da nossa coleção para fazer seu pedido no atacado.</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-8 py-3 hover:brightness-110">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver Produtos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingCart className="h-10 w-10 text-brand-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Sacola Emma
            </h1>
          </div>
          <p className="text-gray-600 text-base">
            Tudo pronto? Revise seus itens e finalize sua compra.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-brand-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-brand-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Progresso do Pedido</h3>
              </div>
              <Badge 
                variant={state.userType === 'wholesale' 
                  ? (minimumOrderMet ? "default" : "secondary")
                  : (retailPromotionMet ? "default" : "secondary")
                }
                className={state.userType === 'wholesale' 
                  ? (minimumOrderMet ? "bg-green-500" : "bg-brand-primary")
                  : (retailPromotionMet ? "bg-green-500" : "bg-brand-secondary")
                }
              >
                {state.userType === 'wholesale' 
                  ? `${state.totalItems}/${state.minimumOrder} pares`
                  : `${state.totalItems}/2 pares`
                }
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  state.userType === 'wholesale' 
                    ? (minimumOrderMet ? 'bg-green-500' : 'bg-brand-primary')
                    : (retailPromotionMet ? 'bg-green-500' : 'bg-brand-secondary')
                }`}
                style={{ 
                  width: `${Math.min(
                    state.userType === 'wholesale' 
                      ? (state.totalItems / state.minimumOrder) * 100
                      : (state.totalItems / 2) * 100, 
                    100
                  )}%` 
                }}
              />
            </div>
            
            {/* Status Message */}
            <div className="flex items-center gap-2">
              {state.userType === 'wholesale' ? (
                // Lógica para usuários de atacado
                minimumOrderMet ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">Pedido mínimo atingido! Você pode finalizar.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-brand-primary" />
                    <span className="text-brand-primary font-medium">
                      Faltam {itemsRemaining} pares para atingir o mínimo de 8 pares
                    </span>
                  </>
                )
              ) : (
                // Lógica para usuários de varejo
                retailPromotionMet ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">🎉 Parabéns! Você ganhou um brinde e está participando da promoção!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-brand-secondary" />
                    <span className="text-brand-secondary font-medium">
                      {state.totalItems === 1 
                        ? "⚠️ Você está perdendo a promoção! Adicione mais 1 par para ganhar um brinde!"
                        : `Faltam ${itemsRemaining} pares para ganhar um brinde e participar da promoção`
                      }
                    </span>
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* ===== INÍCIO DO INDICADOR DE PROMOÇÃO - REMOVER APÓS USO ===== */}
        {(() => {
          const promotionInfo = getPromotionInfo()
          
          if (!promotionInfo.isActive && promotionInfo.eligibleCount > 0) {
            // Mostrar aviso de promoção próxima
            return (
              <div className="mb-8">
                <div className="bg-brand-secondary/5 border border-brand-secondary/30 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-6 w-6 text-brand-secondary" />
                    <h3 className="text-lg font-semibold text-brand-secondary">🎉 Promoção Especial!</h3>
                  </div>
                  <p className="text-brand-secondary">
                    Você tem {promotionInfo.eligibleCount} unidade(s) de produto(s) de R$ 59,90. 
                    Adicione mais {2 - promotionInfo.eligibleCount} unidade(s) de produto(s) de R$ 59,90 
                    para ganhar desconto de R$ 9,95 em cada um!
                  </p>
                </div>
              </div>
            )
          }
          
          if (promotionInfo.isActive) {
            // Mostrar promoção ativa
            return (
              <div className="mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">🎉 Promoção Ativa!</h3>
                  </div>
                  <p className="text-green-700 mb-2">
                    Parabéns! Você ganhou desconto de R$ 9,95 em {promotionInfo.eligibleCount} unidade(s) de produto(s) de R$ 59,90!
                  </p>
                  <p className="text-green-800 font-bold text-lg">
                    💰 Economia total: R$ {promotionInfo.savings.toFixed(2)}
                  </p>
                </div>
              </div>
            )
          }
          
          return null
        })()}
        {/* ===== FIM DO INDICADOR DE PROMOÇÃO ===== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {state.items.map((item, index) => (
                <Card key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="shadow-lg border border-brand-primary/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 relative">
                      {/* Delete Button - Fixed position on all devices */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void removeItem(
                            item.product.id.toString(), 
                            item.selectedSize, 
                            item.selectedColor
                          )
                        }}
                        disabled={isCartSyncing}
                        className="absolute top-1 right-1 text-red-500 hover:text-red-700 z-10 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {/* Product Image and Details */}
                      <div className="flex gap-4 flex-1 pr-12">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={getImageUrl(item.product.images)}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h3 className="font-semibold text-gray-800 text-lg">{item.product.name}</h3>
                              <p className="text-sm text-gray-500">Ref: {item.product.reference || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Variations */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(item.selectedSize || item.selectedColor) && (
                              <Badge 
                                variant="outline" 
                                className="bg-transparent border-brand-primary/40 text-brand-secondary text-xs px-2 py-1"
                              >
                                {[item.selectedSize, item.selectedColor].filter(Boolean).join(' - ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price, Quantity and Actions */}
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-6">
                        {/* Price Display */}
                        <div className="text-center lg:text-right">
                          <p className="text-lg font-bold text-brand-primary">
                            R$ {getPromotionalPrice(item.product).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total: R$ {(getPromotionalPrice(item.product) * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void updateQuantity(
                                item.product.id.toString(),
                                item.quantity - 1,
                                item.selectedSize,
                                item.selectedColor
                              )
                            }}
                            disabled={item.quantity <= 1 || isCartSyncing}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              void updateQuantity(
                                item.product.id.toString(),
                                value,
                                item.selectedSize,
                                item.selectedColor
                              )
                            }}
                            className="w-16 text-center"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void updateQuantity(
                                item.product.id.toString(),
                                item.quantity + 1,
                                item.selectedSize,
                                item.selectedColor
                              )
                            }}
                            disabled={isCartSyncing}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Shipping Information Card */}
            <ShippingInfoCard />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border border-brand-primary/20 sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Crown className="h-6 w-6 text-brand-primary" />
                  <h3 className="text-xl font-bold text-gray-800">Resumo do Pedido</h3>
                </div>

                {/* Order Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Itens:</span>
                    <span className="font-semibold">{state.totalItems} pares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="font-bold text-lg text-brand-primary">
                      R$ {state.items.reduce((sum, item) => sum + (getPromotionalPrice(item.product) * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produtos Diferentes:</span>
                    <span className="font-semibold">{state.items.length}</span>
                  </div>
                </div>

                {/* Minimum Order Warning */}
                {!minimumOrderMet && state.userType === 'wholesale' && (
                  <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-brand-primary" />
                      <span className="font-semibold text-brand-secondary">Pedido Mínimo</span>
                    </div>
                    <p className="text-sm text-brand-primary">
                      Adicione mais {itemsRemaining} pares para atingir o mínimo de 8 pares.
                    </p>
                  </div>
                )}

                {/* Retail Promotion Warning */}
                {state.userType === 'retail' && !retailPromotionMet && (
                  <div className="bg-brand-secondary/5 border border-brand-secondary/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-brand-secondary" />
                      <span className="font-semibold text-brand-secondary">Promoção de Brinde</span>
                    </div>
                    <p className="text-sm text-brand-secondary">
                      {state.totalItems === 1 
                        ? "⚠️ Você está perdendo a promoção! Adicione mais 1 par para ganhar um brinde e participar da promoção!"
                        : `Adicione mais ${itemsRemaining} pares para ganhar um brinde e participar da promoção!`
                      }
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleFinalizeOrder}
                    disabled={!minimumOrderMet || isBusy}
                    className="w-full text-white font-semibold py-3"
                    style={{ backgroundColor: '#60c56f' }}
                  >
                    {isFinalizing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Finalizar Pedido
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      void clearCart()
                    }}
                    disabled={isCartSyncing}
                    className="w-full border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Carrinho
                  </Button>

                  <Link href="/">
                    <Button variant="ghost" className="w-full text-gray-600">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Continuar Comprando
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 