"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Package, TrendingUp, Crown, Calculator, Users } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { WholesalePackage } from "@/types/wholesale-package"

interface WholesalePackageCardProps {
  package: WholesalePackage
  featured?: boolean
}

export default function WholesalePackageCard({ package: pkg, featured = false }: WholesalePackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showWhiteLabel, setShowWhiteLabel] = useState(false)

  const discount = pkg.originalPrice ? Math.round(((pkg.originalPrice - pkg.basePrice) / pkg.originalPrice) * 100) : 0
  const totalSavings = pkg.originalPrice ? pkg.originalPrice - pkg.basePrice : 0

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border",
        featured ? "border-brand-primary shadow-2xl" : "border-brand-primary/20",
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-brand-primary text-white font-semibold">{pkg.category}</Badge>
            {pkg.isPopular && (
              <Badge className="bg-red-500 text-white font-semibold flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Mais Popular
              </Badge>
            )}
            {discount > 0 && <Badge className="bg-green-500 text-white font-semibold">Economize {discount}%</Badge>}
          </div>

          {/* Profit Margin */}
          <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-bold">
            {pkg.profitMargin} Lucro
          </div>

          {/* Price */}
          <div className="absolute bottom-4 right-4 text-right">
            {pkg.originalPrice && (
              <p className="text-white/80 text-sm line-through">R$ {pkg.originalPrice.toFixed(2)}</p>
            )}
            <p className="text-white text-3xl font-bold">R$ {pkg.basePrice.toFixed(2)}</p>
          </div>

          {/* Featured Crown */}
          {featured && <Crown className="absolute bottom-4 left-4 h-8 w-8 text-brand-primary animate-pulse" />}
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
            <p className="text-gray-600 leading-relaxed mb-4">{pkg.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-brand-primary" />
                <div>
                  <p className="text-gray-500">Pedido Mín.</p>
                  <p className="font-semibold">{pkg.minimumOrder} pares</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-gray-500">Margem de Lucro</p>
                  <p className="font-semibold text-green-600">{pkg.profitMargin}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-brand-primary" />
              Benefícios do Pacote
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pkg.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-primary" />
                  <span className="text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* White Label Options */}
          <div className="mb-6">
            <button
              onClick={() => setShowWhiteLabel(!showWhiteLabel)}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-primary" />
                Opções White-Label ({pkg.whiteLabelOptions.length})
              </h4>
              {showWhiteLabel ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {showWhiteLabel && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                {pkg.whiteLabelOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start gap-3 p-3 bg-brand-primary/5 rounded-lg border border-brand-primary/20"
                  >
                    <span className="text-xl flex-shrink-0">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-gray-800 text-sm">{option.name}</h5>
                        <Badge variant="outline" className="border-brand-primary text-brand-primary text-xs">
                          +R$ {option.price.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-xs">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/5500000000000?text=Tenho interesse no pacote de atacado ${pkg.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full font-semibold py-3 text-white" style={{ backgroundColor: pkg.color }}>
                <Package className="h-4 w-4 mr-2" />
                Pedir Pacote
              </Button>
            </a>
            <Button variant="outline" className="sm:w-auto px-6" style={{ borderColor: pkg.color, color: pkg.color }}>
              <Calculator className="h-4 w-4 mr-2" />
              Calcular ROI
            </Button>
          </div>

          {/* Savings */}
          {totalSavings > 0 && (
            <div className="mt-4 text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">
                💰 Você economiza R$ {totalSavings.toFixed(2)} com este pacote!
              </p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
