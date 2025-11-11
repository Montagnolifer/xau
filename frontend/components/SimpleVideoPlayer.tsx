"use client"

import { X, Play } from "lucide-react"
import type { Product } from "@/types/product"

interface SimpleVideoPlayerProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function SimpleVideoPlayer({ product, isOpen, onClose }: SimpleVideoPlayerProps) {
  if (!isOpen || !product.youtubeUrl) return null

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

  const videoId = getYouTubeVideoId(product.youtubeUrl)
  
  if (!videoId) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h3 className="font-bold mb-2">Erro no Vídeo</h3>
          <p className="text-sm text-gray-600 mb-4">Não foi possível extrair o ID do vídeo da URL:</p>
          <p className="text-xs bg-gray-100 p-2 rounded">{product.youtubeUrl}</p>
          <button 
            onClick={onClose}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
      <div className="relative w-80 h-[500px] bg-black rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-600 to-amber-600 text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player */}
        <div className="relative w-full h-[calc(100%-4rem)] bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&fs=1`}
            title={`Vídeo do produto ${product.name}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
