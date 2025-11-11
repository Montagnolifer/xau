"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Crown, TrendingUp, Package, Calculator } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Shoe } from "@/types/shoe"

interface ShoeCardProps {
  shoe: Shoe
}

export default function ShoeCard({ shoe }: ShoeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(shoe.variants[0])
  const whatsappNumber = "5518920044699" // Para componentes client-side

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === shoe.images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? shoe.images.length - 1 : prev - 1))
  }

  const profitMargin = (((shoe.retailPrice - shoe.wholesalePrice) / shoe.wholesalePrice) * 100).toFixed(0)
  const totalProfit = (shoe.retailPrice - shoe.wholesalePrice) * shoe.minimumOrder

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-yellow-100">
      <div className="relative">
        {/* Image Carousel */}
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={shoe.images[currentImageIndex] || "/placeholder.svg"}
            alt={`${shoe.name} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover"
          />

          {/* Navigation */}
          {shoe.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-yellow-600 text-white font-semibold">{shoe.category}</Badge>
            {shoe.isNewArrival && <Badge className="bg-green-500 text-white font-semibold">Novo</Badge>}
            {shoe.isBestseller && (
              <Badge className="bg-red-500 text-white font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Mais Vendido
              </Badge>
            )}
          </div>

          {/* Profit Indicator */}
          <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            +{profitMargin}% Profit
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-800">{shoe.name}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-1">by {shoe.brand}</p>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{shoe.description}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">Preço Atacado</p>
              <p className="text-2xl font-bold text-yellow-700">R$ {shoe.wholesalePrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Preço Sugerido</p>
              <p className="text-2xl font-bold text-green-700">R$ {shoe.retailPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Minimum Order & Profit */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Pedido Mín.</p>
                <p className="font-semibold">{shoe.minimumOrder} pairs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Lucro Total</p>
                <p className="font-semibold text-green-600">R$ {totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Variações Disponíveis</p>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {shoe.variants.map((variant, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVariant(variant)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border text-xs transition-all",
                    selectedVariant === variant
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: variant.colorHex }} />
                  <span className="font-medium">{variant.size}</span>
                  <span className="text-gray-500">({variant.stock})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Características</p>
            <div className="flex flex-wrap gap-2">
              {shoe.features.slice(0, 4).map((feature, index) => (
                <Badge key={index} variant="outline" className="border-yellow-300 text-yellow-700 text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=Quero fazer pedido do ${shoe.name} (Mín: ${shoe.minimumOrder} pares)`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <button className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                Pedir no Atacado
              </button>
            </a>
            <button className="sm:w-auto px-6 border-2 border-yellow-600 text-yellow-700 hover:bg-yellow-50 font-semibold py-3 rounded-lg transition-colors">
              Solicitar Orçamento
            </button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
