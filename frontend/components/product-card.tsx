"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/product"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const whatsappNumber = "5518920044699" // Para componentes client-side

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Confira o produto: ${product.name}`,
        url: window.location.href,
      })
    }
  }

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        {/* Carrossel de imagens */}
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={
              typeof product.images[currentImageIndex] === 'string' 
                ? product.images[currentImageIndex] 
                : product.images[currentImageIndex]?.url || "/placeholder.svg"
            }
            alt={`${product.name} - Imagem ${currentImageIndex + 1}`}
            fill
            className="object-cover"
          />

          {/* Navegação do carrossel */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Indicadores de imagem */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                {product.images.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      currentImageIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/60",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cabeçalho do card */}
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            Ref: {product.reference}
          </div>
          <div className="flex gap-2">
            <button
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
              aria-label="Favoritar"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
              aria-label="Compartilhar"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <CardContent className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{product.description}</p>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Preço</p>
            <p className="text-2xl font-bold text-gray-900">R$ {product.price.toFixed(2)}</p>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber}?text=Olá! Tenho interesse no produto ${product.name} (Ref: ${product.reference})`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
          >
            Comprar
          </a>
        </div>

        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3 font-medium">Tamanhos disponíveis</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <div
                  key={size}
                  className="border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  {size}
                </div>
              ))}
            </div>
          </div>
        )}

        {product.colors && product.colors.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-3 font-medium">Cores disponíveis</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <div
                  key={color.name}
                  className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
