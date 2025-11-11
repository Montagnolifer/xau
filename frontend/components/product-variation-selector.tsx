"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, ShoppingCart, Crown } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Product, Color } from "@/types/product"

interface ProductVariationSelectorProps {
  product: Product
  trigger?: React.ReactNode
}

export default function ProductVariationSelector({ product, trigger }: ProductVariationSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const { addItem } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()

  // Função para determinar o preço correto baseado no tipo de usuário
  const getDisplayPrice = () => {
    if (!isAuthenticated || !user) {
      return product.price // Preço padrão se não estiver logado
    }
    
    if (user.isWholesale && product.wholesalePrice) {
      return product.wholesalePrice // Preço de atacado para usuários de atacado
    }
    
    return product.price // Preço normal para usuários de varejo
  }

  const displayPrice = getDisplayPrice()
  const isWholesalePrice = user?.isWholesale && product.wholesalePrice

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Redirecionar para login
      window.location.href = "/auth/login"
      return
    }

    // Validar se as variações necessárias foram selecionadas
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Por favor, selecione um tamanho")
      return
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Por favor, selecione uma cor")
      return
    }

    // Adicionar ao carrinho
    addItem({
      product,
      quantity,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined
    })

    // Mostrar notificação
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho`,
      duration: 3000,
    })

    // Resetar estado e fechar modal
    setSelectedSize("")
    setSelectedColor("")
    setQuantity(1)
    setIsOpen(false)
  }

  const handleSizeSelect = (size: string) => {
    setSelectedSize(selectedSize === size ? "" : size)
  }

  const handleColorSelect = (color: Color) => {
    setSelectedColor(selectedColor === color.name ? "" : color.name)
  }

  const isVariationValid = () => {
    const hasSize = !product.sizes || product.sizes.length === 0 || selectedSize
    const hasColor = !product.colors || product.colors.length === 0 || selectedColor
    return hasSize && hasColor
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:brightness-110">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-brand-primary" />
            Adicionar ao Carrinho
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-800 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-2">Ref: {product.reference || 'N/A'}</p>
            <div className="mb-2">
              <p className="text-xl font-bold text-brand-primary">R$ {displayPrice.toFixed(2)}</p>
              {isWholesalePrice && product.price && (
                <p className="text-xs text-gray-500 mt-1">
                  Preço normal: R$ {product.price.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Selecione o Tamanho</h4>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSizeSelect(size)}
                    className={selectedSize === size ? "bg-brand-primary hover:bg-brand-secondary text-white" : "border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10"}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Selecione a Cor</h4>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <Button
                    key={color.name}
                    variant={selectedColor === color.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleColorSelect(color)}
                    className={`flex items-center gap-2 ${
                      selectedColor === color.name 
                        ? "bg-brand-primary hover:bg-brand-secondary text-white" 
                        : "border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Quantidade</h4>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
                min="1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Selected Variations Summary */}
          {(selectedSize || selectedColor) && (
            <Card className="bg-brand-primary/5 border border-brand-primary/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Seleção Atual:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSize && (
                    <Badge variant="outline" className="border-brand-primary/30 text-brand-primary">
                      Tamanho: {selectedSize}
                    </Badge>
                  )}
                  {selectedColor && (
                    <Badge variant="outline" className="border-brand-primary/30 text-brand-primary">
                      Cor: {selectedColor}
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-brand-primary/30 text-brand-primary">
                    Qtd: {quantity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!isVariationValid()}
            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 hover:brightness-110"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 