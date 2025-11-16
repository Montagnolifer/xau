"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Crown, TrendingUp, Package, Lock, X, Star, Play, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import ProductVariationSelector from "./product-variation-selector"
import SimpleVideoPlayer from "./SimpleVideoPlayer"
import type { Product, ProductImage } from "@/types/product"

interface ProductWholesaleCardProps {
  product: Product
}

export default function ProductWholesaleCard({ product }: ProductWholesaleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const whatsappNumber = "5518920044699" // Para componentes client-side


  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const openImageModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
  }

  const openVideoModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
  }

  // Determinar qual preço mostrar baseado no tipo de usuário
  const getDisplayPrice = () => {
    if (!isAuthenticated || !user) {
      return product.price // Mostrar preço de varejo para visitantes
    }
    
    if (user.isWholesale && product.wholesalePrice) {
      return product.wholesalePrice // Preço de atacado para usuários de atacado
    }
    
    return product.price // Preço normal para usuários de varejo
  }

  const displayPrice = getDisplayPrice()
  const isWholesalePrice = user?.isWholesale && product.wholesalePrice

  // Determinar se é bestseller ou new arrival baseado no ID (simulação)
  const isBestseller = product.id <= 2
  const isNewArrival = product.id >= 5

  // Mapear categoria para nome de exibição
  const getCategoryDisplay = (category: string) => {
    switch (category) {
      case "rasteiras":
        return "Rasteiras"
      case "sandalias":
        return "Sandálias"
      default:
        return category?.charAt(0).toUpperCase() + category?.slice(1) || "Produto"
    }
  }

  return (
    <>
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-brand-primary/20">
        <div className="relative">
          {/* Image Carousel */}
          <div className="relative h-64 md:h-80 w-full">
            <Image
              src={typeof product.images[currentImageIndex] === 'string' 
                ? product.images[currentImageIndex] as string 
                : (product.images[currentImageIndex] as ProductImage).url || "/placeholder.svg"}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              fill
              className="object-cover cursor-pointer"
              onClick={openImageModal}
            />

            {/* Navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg z-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg z-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isFavorite ? (
                <Badge className="bg-brand-secondary text-white font-semibold flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Destaque
                </Badge>
              ) : (
                <Badge className="bg-brand-primary text-white font-semibold">
                  {getCategoryDisplay(product.category || "")}
                </Badge>
              )}
              {isNewArrival && <Badge className="bg-green-500 text-white font-semibold">Novo</Badge>}
              {isBestseller && (
                <Badge className="bg-red-500 text-white font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Mais Vendido
                </Badge>
              )}
            </div>

            {/* Profit Indicator */}
            {/* 
            <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              +150% Lucro
            </div> */}

            {/* Favorite Indicator */}
            {product.isFavorite && (
              <div className="absolute top-4 right-4 transform translate-x-16">
                <div className="bg-brand-secondary text-white p-2 rounded-full shadow-lg">
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
            )}

            {/* Video Play Button */}
            {product.youtubeUrl && (
              <button
                onClick={openVideoModal}
                className="absolute bottom-4 right-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-10 hover:brightness-110"
                title="Ver vídeo do produto"
              >
                <Play className="h-5 w-5 fill-current" />
              </button>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {/*<Crown className="h-5 w-5 text-brand-primary" />*/}
                  <h3 className="text-lg font-bold text-gray-800 leading-tight break-words">{product.name}</h3>
                </div>
                {/* <p className="text-sm text-gray-500 mb-1">Ref: {product.reference}</p> */}
                {/* <p className="text-gray-600 text-sm leading-relaxed mb-4">{product.description}</p> */}
                
                {/* Informações de preço - sempre exibir */}
                {displayPrice && (
                  <div className="mb-4">
                    <div className="mb-2">
                      <p className="text-xl font-bold text-brand-primary">R$ {displayPrice.toFixed(2)}</p>
                      {isWholesalePrice && product.price && (
                        <p className="text-xs text-gray-500 mt-1">
                          Preço normal: R$ {product.price.toFixed(2)}
                        </p>
                      )}
                      {/* Mensagem para visitantes não logados */}
                      {!isAuthenticated && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Link href="/auth/login" className="text-brand-primary hover:text-brand-secondary underline">
                            Faça login para participar das promoções
                          </Link>
                        </p>
                      )}
                    </div>
                    {/* Pedido mínimo apenas para atacado */}
                    {user?.isWholesale && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600">Mínimo de <span className="font-semibold">8 Pares</span></p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sizes - Comentado pois as variações aparecem no seletor de adicionar ao carrinho */}
            {/* {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Tamanhos Disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <Badge key={index} variant="outline" className="border-brand-primary/30 text-brand-primary text-xs px-3 py-1">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            )} */}

            {/* Colors - Comentado pois as variações aparecem no seletor de adicionar ao carrinho */}
            {/* {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Cores Disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 border border-brand-primary/30 rounded-lg px-3 py-1 text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-gray-700">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* CTA */}
            <div>
              {product.paymentLink ? (
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:brightness-110"
                >
                  <a
                    href={product.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Comprar agora
                  </a>
                </Button>
              ) : (
                isAuthenticated && (
                  // Seletor de variações quando logado
                  <ProductVariationSelector product={product} />
                )
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main Image */}
            <div className="relative w-full h-full">
              <Image
                src={typeof product.images[currentImageIndex] === 'string' 
                  ? product.images[currentImageIndex] as string 
                  : (product.images[currentImageIndex] as ProductImage).url || "/placeholder.svg"}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                width={800}
                height={600}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />

              {/* Navigation in Modal */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} de {product.images.length}
              </div>
            </div>

            {/* Product Info in Modal */}
            <div className="mt-4 text-center text-white">
              <h3 className="text-xl font-bold mb-2">{product.name}</h3>
              <p className="text-sm text-gray-300">Ref: {product.reference}</p>
            </div>

            {/* Thumbnail Navigation */}
            {product.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-brand-primary scale-110' 
                        : 'border-white/30 hover:border-white/50'
                    }`}
                  >
                    <Image
                      src={typeof product.images[index] === 'string' 
                        ? product.images[index] as string 
                        : (product.images[index] as ProductImage).url || "/placeholder.svg"}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Player Component */}
      <SimpleVideoPlayer 
        product={product}
        isOpen={isVideoModalOpen}
        onClose={closeVideoModal}
      />
    </>
  )
}
