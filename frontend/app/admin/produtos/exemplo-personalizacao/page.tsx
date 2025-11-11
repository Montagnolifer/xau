"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductCustomizationSelector } from "@/components/product-customization-selector"
import { Customization, ProductCustomization } from "@/types/customization"
import { DollarSign, Package, Tag } from "lucide-react"

export default function ExemploPersonalizacaoPage() {
  // Dados de exemplo das personalizações configuradas
  const [customizations] = useState<Customization[]>([
    {
      id: "1",
      title: "Personalizar Nome",
      description: "Adicione o nome personalizado ao produto",
      price: 5.00,
      isActive: true,
      type: "text"
    },
    {
      id: "2",
      title: "Escolher Cor",
      description: "Selecione a cor personalizada do produto",
      price: 3.50,
      isActive: true,
      type: "color"
    },
    {
      id: "3",
      title: "Tamanho Especial",
      description: "Escolha um tamanho personalizado",
      price: 2.00,
      isActive: true,
      type: "select",
      options: ["Pequeno", "Médio", "Grande", "Extra Grande"]
    },
    {
      id: "4",
      title: "Upload de Logo",
      description: "Adicione sua logo personalizada",
      price: 8.00,
      isActive: true,
      type: "image"
    }
  ])

  const [selectedCustomizations, setSelectedCustomizations] = useState<ProductCustomization[]>([])
  const [productPrice] = useState(29.99)

  const totalPrice = productPrice + selectedCustomizations.reduce((total, c) => total + c.price, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Exemplo de Personalização</h1>
        <p className="text-slate-600 mt-1">
          Demonstração de como as personalizações funcionam em um produto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produto de Exemplo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Imagem do Produto</span>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">Tênis Esportivo Premium</h3>
              <p className="text-gray-600">
                Tênis de alta qualidade com tecnologia avançada para máximo conforto e performance.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  R$ {productPrice.toFixed(2)}
                </span>
              </div>
              <Badge variant="secondary">Em estoque</Badge>
            </div>

            {/* Resumo das personalizações selecionadas */}
            {selectedCustomizations.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Personalizações Selecionadas:</h4>
                <div className="space-y-1">
                  {selectedCustomizations.map((customization) => {
                    const customizationConfig = customizations.find(c => c.id === customization.customizationId)
                    return (
                      <div key={customization.customizationId} className="flex items-center justify-between text-sm">
                        <span>
                          <Tag className="h-3 w-3 inline mr-1" />
                          {customizationConfig?.title}: {customization.value || "Não especificado"}
                        </span>
                        <span className="text-green-600">
                          +R$ {customization.price.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Preço total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Preço Total:</span>
                <span className="text-green-600">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Adicionar ao Carrinho
            </Button>
          </CardContent>
        </Card>

        {/* Seletor de Personalizações */}
        <div>
          <ProductCustomizationSelector
            customizations={customizations}
            selectedCustomizations={selectedCustomizations}
            onCustomizationsChange={setSelectedCustomizations}
          />
        </div>
      </div>

      {/* Informações */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Como funciona:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Clique nas personalizações que deseja adicionar ao produto</li>
            <li>• Preencha os valores solicitados para cada personalização</li>
            <li>• O preço adicional será calculado automaticamente</li>
            <li>• As personalizações podem ser ativadas/desativadas nas configurações</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 