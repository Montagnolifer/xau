"use client"

import { useState, useEffect } from "react"
import { X, Play } from "lucide-react"
import type { Product } from "@/types/product"

interface VideoPlayerProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function VideoPlayer({ product, isOpen, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  // Função para extrair o ID do vídeo do YouTube
  const getYouTubeVideoId = (url: string) => {
    // Regex para Shorts do YouTube
    const shortsRegex = /youtube\.com\/shorts\/([^"&?\/\s]{11})/
    const shortsMatch = url.match(shortsRegex)
    if (shortsMatch) {
      return shortsMatch[1]
    }
    
    // Regex para vídeos normais do YouTube
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    if (match) {
      return match[1]
    }
    
    return null
  }

  // Função para detectar se é um Short do YouTube
  const isYouTubeShort = (url: string) => {
    return url.includes('/shorts/') || url.includes('youtube.com/shorts/')
  }

  // Resetar estados quando o modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }, [isOpen])

  // Fechar modal ao pressionar Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !product.youtubeUrl) return null

  const videoId = getYouTubeVideoId(product.youtubeUrl)
  const isShort = isYouTubeShort(product.youtubeUrl)

  if (!videoId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 pointer-events-none">
      {/* Overlay para fechar */}
      <div 
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Card do vídeo */}
      <div className="relative w-80 h-[500px] bg-white rounded-xl shadow-2xl overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Vídeo do Produto</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player */}
        <div className="relative w-full h-64 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1&controls=1&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`}
            title={`Vídeo do produto ${product.name}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          
          {/* Overlay de controles personalizados */}
          <div className="absolute inset-0 bg-transparent pointer-events-none">
            {/* Indicador de Short */}
            {isShort && (
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                SHORT
              </div>
            )}
          </div>
        </div>

        {/* Informações do produto */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">{product.name}</h3>
            {product.reference && (
              <p className="text-sm text-gray-500 mt-1">Ref: {product.reference}</p>
            )}
          </div>

          {/* Preço */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">
              R$ {product.price.toFixed(2)}
            </span>
            {product.wholesalePrice && (
              <span className="text-sm text-gray-500 line-through">
                R$ {product.wholesalePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Categoria */}
          {product.category && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Categoria:</span>
              <span className="text-sm font-medium text-gray-800 capitalize">
                {product.category}
              </span>
            </div>
          )}

          {/* Botão de ação */}
          <button 
            onClick={() => window.open(product.youtubeUrl, '_blank')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            Ver no YouTube
          </button>
        </div>
      </div>
    </div>
  )
}
