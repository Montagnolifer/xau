"use client"

import { useState, useEffect } from "react"
import PackageCard from "@/components/package-card"
import { getPackages } from "@/data/packages"
import { Crown, Package, TrendingUp, Loader2 } from "lucide-react"
import type { Package as PackageType } from "@/types/package"

export default function PacotesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [packages, setPackages] = useState<PackageType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const whatsappNumber = "5518920044699" // Para componentes client-side

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true)
        setError(null)
        const packagesData = await getPackages()
        setPackages(packagesData)
      } catch (err) {
        console.error('Erro ao carregar pacotes:', err)
        setError('Erro ao carregar os pacotes. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }

    loadPackages()
  }, [])

  const featuredPackage = packages.find((p) => p.isPopular) || packages[0]
  const categories = [...new Set(packages.map((p) => p.category))]

  // Filtrar pacotes por categoria
  const filteredPackages =
    selectedCategory === "all" ? packages : packages.filter((pkg) => pkg.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando pacotes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Package className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-10 w-10 text-yellow-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text text-transparent">
              Pacotes de serviços
            </h1>
            <Package className="h-10 w-10 text-yellow-600" />
          </div>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Soluções completas de branding e marketing para construir sua marca de calçados
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 ${
              selectedCategory === "all"
                ? "bg-yellow-600 text-white shadow-lg transform scale-105"
                : "border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400"
            }`}
          >
            Todos os Pacotes
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-yellow-600 text-white shadow-lg transform scale-105"
                  : "border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Mostrando {filteredPackages.length} pacotes
            {selectedCategory !== "all" && (
              <span className="font-semibold text-yellow-700"> em {selectedCategory}</span>
            )}
          </p>
        </div>

        {/* All Packages */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === "all" ? "Todos os Pacotes de Serviços" : `Pacotes ${selectedCategory}`}
            </h2>
          </div>

          {filteredPackages.map((packageItem) => (
            <PackageCard key={packageItem.id} package={packageItem} />
          ))}
        </div>

        {/* Empty State */}
        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum pacote encontrado</h3>
            <p className="text-gray-500">Tente selecionar uma categoria diferente</p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Mostrar Todos os Pacotes
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
          <Crown className="h-16 w-16 mx-auto mb-6 text-yellow-200" />
          <h3 className="text-3xl font-bold mb-4">Precisa de uma solução personalizada?</h3>
          <p className="text-xl mb-8 text-yellow-100 max-w-2xl mx-auto">
            Deixe-nos criar um pacote de marca personalizado, adaptado às necessidades e objetivos do seu negócio
          </p>
          <a
            href={`https://wa.me/${whatsappNumber}?text=Preciso de um pacote de marca personalizado`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-yellow-700 font-bold py-4 px-12 rounded-full hover:bg-yellow-50 transition-colors text-xl shadow-lg transform hover:scale-105"
          >
            Solicitar pacote personalizado
          </a>
        </div>
      </div>
    </div>
  )
}
