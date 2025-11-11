"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Clock, Star, Sparkles, Crown } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Package } from "@/types/package"

interface PackageCardProps {
  package: Package
  featured?: boolean
}

export default function PackageCard({ package: pkg, featured = false }: PackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const discount = pkg.originalPrice ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) : 0
  const whatsappNumber = "5518920044699" // Para componentes client-side

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300",
        featured && "ring-2 ring-yellow-400 shadow-2xl",
      )}
    >
      <div className="relative">
        {/* Image */}
        <div className="relative h-48 md:h-64 w-full">
          <Image 
            src={pkg.image || pkg.thumbnailUrl || "/placeholder.svg"} 
            alt={pkg.name} 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-white/90 text-gray-800 font-semibold">{pkg.category}</Badge>
            {pkg.isPopular && (
              <Badge className="bg-yellow-500 text-white font-semibold flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Mais Popular
              </Badge>
            )}
            {discount > 0 && <Badge className="bg-red-500 text-white font-semibold">-{discount}%</Badge>}
          </div>

          {/* Price */}
          <div className="absolute bottom-4 right-4 text-right">
            {pkg.originalPrice && (
              <p className="text-white/80 text-sm line-through">R$ {Number(pkg.originalPrice).toFixed(2)}</p>
            )}
            <p className="text-white text-2xl font-bold">R$ {Number(pkg.price).toFixed(2)}</p>
          </div>

          {/* Featured Sparkles */}
          {featured && (
            <>
              <Sparkles className="absolute top-4 right-4 h-6 w-6 text-yellow-400 animate-pulse" />
              <Sparkles className="absolute bottom-4 left-4 h-4 w-4 text-yellow-400 animate-pulse delay-500" />
            </>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{pkg.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{pkg.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>4.9</span>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights */}
          {pkg.highlights.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-500" />
                Destaques do Pacote
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pkg.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pkg.color }} />
                    <span className="text-gray-600">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          <div className="mb-6">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pkg.color }} />
                Serviços Inclusos ({pkg.services.length})
              </h4>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                {pkg.services.map((service) => (
                  <div key={service.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl flex-shrink-0">{service.icon}</span>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800 text-sm">{service.name}</h5>
                      <p className="text-gray-600 text-xs mt-1">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=Olá! Tenho interesse no ${pkg.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full font-semibold py-3" style={{ backgroundColor: pkg.color }}>
                Agendar Agora
              </Button>
            </a>
            <Button variant="outline" className="sm:w-auto px-6" style={{ borderColor: pkg.color, color: pkg.color }}>
              Mais Info
            </Button>
          </div>

          {/* Savings */}
          {pkg.originalPrice && (
            <div className="mt-4 text-center">
              <p className="text-sm text-green-600 font-medium">
                💰 Você economiza R$ {(Number(pkg.originalPrice) - Number(pkg.price)).toFixed(2)} neste pacote!
              </p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
