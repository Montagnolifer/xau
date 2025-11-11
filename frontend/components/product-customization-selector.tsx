"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Tag, 
  DollarSign,
  Check,
  X
} from "lucide-react"
import { Customization, ProductCustomization } from "@/types/customization"

interface ProductCustomizationSelectorProps {
  customizations: Customization[]
  selectedCustomizations: ProductCustomization[]
  onCustomizationsChange: (customizations: ProductCustomization[]) => void
}

export function ProductCustomizationSelector({
  customizations,
  selectedCustomizations,
  onCustomizationsChange,
}: ProductCustomizationSelectorProps) {
  const [customizationValues, setCustomizationValues] = useState<Record<string, string>>({})

  const handleCustomizationToggle = (customization: Customization) => {
    const isSelected = selectedCustomizations.some(c => c.customizationId === customization.id)
    
    if (isSelected) {
      // Remove a personalização
      onCustomizationsChange(
        selectedCustomizations.filter(c => c.customizationId !== customization.id)
      )
      // Remove o valor
      const newValues = { ...customizationValues }
      delete newValues[customization.id]
      setCustomizationValues(newValues)
    } else {
      // Adiciona a personalização com valor padrão
      const newCustomization: ProductCustomization = {
        customizationId: customization.id,
        value: "",
        price: customization.price
      }
      onCustomizationsChange([...selectedCustomizations, newCustomization])
    }
  }

  const handleValueChange = (customizationId: string, value: string) => {
    setCustomizationValues(prev => ({
      ...prev,
      [customizationId]: value
    }))

    // Atualiza o valor na lista de personalizações selecionadas
    const updatedCustomizations = selectedCustomizations.map(c => 
      c.customizationId === customizationId 
        ? { ...c, value }
        : c
    )
    onCustomizationsChange(updatedCustomizations)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Texto'
      case 'image': return 'Imagem'
      case 'color': return 'Cor'
      default: return type
    }
  }

  const getTotalCustomizationPrice = () => {
    return selectedCustomizations.reduce((total, c) => total + c.price, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Personalizações Disponíveis</h3>
        {selectedCustomizations.length > 0 && (
          <Badge variant="secondary">
            +R$ {getTotalCustomizationPrice().toFixed(2)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customizations.filter(c => c.isActive).map((customization) => {
          const isSelected = selectedCustomizations.some(c => c.customizationId === customization.id)
          const currentValue = customizationValues[customization.id] || ""

          return (
            <Card 
              key={customization.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleCustomizationToggle(customization)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {customization.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getTypeLabel(customization.type)}
                    </Badge>
                    <Badge variant="secondary">
                      +R$ {customization.price.toFixed(2)}
                    </Badge>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {customization.description}
                </p>
              </CardHeader>

              {isSelected && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {customization.type === 'text' && (
                      <div>
                        <Label htmlFor={`customization-${customization.id}`}>
                          Digite o texto personalizado
                        </Label>
                        <Input
                          id={`customization-${customization.id}`}
                          value={currentValue}
                          onChange={(e) => handleValueChange(customization.id, e.target.value)}
                          placeholder="Ex: João Silva"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {customization.type === 'color' && (
                      <div>
                        <Label htmlFor={`customization-${customization.id}`}>
                          Escolha a cor
                        </Label>
                        <div className="flex gap-2 mt-2">
                          {['Vermelho', 'Azul', 'Verde', 'Amarelo', 'Preto', 'Branco'].map((color) => (
                            <Button
                              key={color}
                              variant={currentValue === color ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleValueChange(customization.id, color)
                              }}
                            >
                              {color}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    

                    {customization.type === 'image' && (
                      <div>
                        <Label htmlFor={`customization-${customization.id}`}>
                          Upload da imagem
                        </Label>
                        <Input
                          id={`customization-${customization.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleValueChange(customization.id, file.name)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {selectedCustomizations.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">Personalizações Selecionadas:</h4>
            <div className="space-y-2">
              {selectedCustomizations.map((customization) => {
                const customizationConfig = customizations.find(c => c.id === customization.customizationId)
                return (
                  <div key={customization.customizationId} className="flex items-center justify-between text-sm">
                    <span>
                      <strong>{customizationConfig?.title}:</strong> {customization.value || "Não especificado"}
                    </span>
                    <span className="text-green-600 font-medium">
                      +R$ {customization.price.toFixed(2)}
                    </span>
                  </div>
                )
              })}
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between font-medium">
                  <span>Total das personalizações:</span>
                  <span className="text-green-600">
                    +R$ {getTotalCustomizationPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 