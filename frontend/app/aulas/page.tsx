"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Users, Clock, Crown, TrendingUp, Award } from "lucide-react"
import { categories } from "@/data/courses"
import { useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function AulasPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, isLoading } = useAuth()
  
  // Variável de pré-lançamento - mude para false quando quiser lançar
  const isPreLaunch = true

  // Debug para verificar o estado de autenticação
  useEffect(() => {
    console.log('Estado de autenticação:', { isAuthenticated, isLoading })
  }, [isAuthenticated, isLoading])

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  const featuredCategory = categories[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50">
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden bg-gradient-to-r from-yellow-900 via-amber-800 to-orange-900">
        <Image
          src={featuredCategory.thumbnailUrl || "/placeholder.svg"}
          alt={featuredCategory.name}
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-12 w-12 text-yellow-400" />
              <span className="text-4xl md:text-5xl">{featuredCategory.icon}</span>
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 px-4 py-2 text-lg font-bold">
                {isPreLaunch ? "EM BREVE" : "PREMIUM EDUCATION"}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent">
              {featuredCategory.name}
            </h1>
            <p className="text-lg md:text-xl text-yellow-100 mb-6 max-w-2xl leading-relaxed">
              {featuredCategory.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={`/aulas/categoria/${featuredCategory.id}`}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold px-8 py-4 text-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {isPreLaunch ? "Em Breve" : "Start Learning"}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-yellow-300 bg-transparent text-yellow-100 hover:bg-yellow-500/20 font-bold px-8 py-4 text-lg"
              >
                <Users className="h-5 w-5 mr-2" />
                {featuredCategory.lessonsCount} Aulas
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section - Só mostra se não estiver em pré-lançamento */}
      {!isPreLaunch && (
        <div className="px-4 md:px-12 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award className="h-8 w-8 text-yellow-600" />
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text text-transparent">
                  Categorias de Educação Empresarial
                </h2>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Domine o negócio de calçados com nossos programas educacionais abrangentes
              </p>
            </div>

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800">Cursos Populares</h3>
              <div className="hidden md:flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollLeft}
                  className="border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollRight}
                  className="border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Horizontal Scroll Categories */}
            <div
              ref={scrollRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((category, index) => (
                <Link key={category.id} href={`/aulas/categoria/${category.id}`}>
                  <Card className="relative group cursor-pointer flex-shrink-0 w-48 md:w-56 h-72 md:h-80 overflow-hidden border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <Image
                        src={category.thumbnailUrl || "/placeholder.svg"}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Category Icon */}
                      <div className="absolute top-4 left-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                      </div>

                      {/* Lessons Count Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 px-3 py-1 font-bold">
                          <Clock className="h-3 w-3 mr-1" />
                          {category.lessonsCount}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4 className="text-lg md:text-xl font-bold mb-2 text-white">{category.name}</h4>
                        <p className="text-sm text-gray-200 mb-3 line-clamp-2">{category.description}</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-400 to-amber-400"
                            style={{
                              width: `${Math.random() * 60 + 20}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span>{category.lessonsCount} aulas</span>
                          <Badge className="bg-green-500 text-white text-xs">Iniciante</Badge>
                        </div>
                      </div>

                      {/* Hover Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center shadow-2xl">
                          <Play className="h-8 w-8 text-white ml-1" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Continue Learning Section - Só mostra se estiver logado */}
            {!isLoading && isAuthenticated && (
              <div className="mt-16">
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800">Continuar Aprendendo</h3>
                  <Badge className="bg-yellow-500 text-white">Em Andamento</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.slice(0, 3).map((category) => (
                    <Link key={`continue-${category.id}`} href={`/aulas/categoria/${category.id}`}>
                      <Card className="group cursor-pointer bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center p-4">
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden mr-4 border-2 border-yellow-300">
                            <Image
                              src={category.thumbnailUrl || "/placeholder.svg"}
                              alt={category.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 mb-1">{category.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">Aula 2 de {category.lessonsCount}</p>
                            <div className="w-full bg-yellow-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500"
                                style={{
                                  width: "35%",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA Section - Sempre mostra */}
      <div className="px-4 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
            <Crown className="h-16 w-16 mx-auto mb-6 text-yellow-200" />
            <h3 className="text-3xl font-bold mb-4">
              {isPreLaunch 
                ? "Preparado para Dominar o Negócio de Calçados?" 
                : "Pronto para Dominar o Negócio de Calçados?"
              }
            </h3>
            <p className="text-xl mb-8 text-yellow-100 max-w-2xl mx-auto">
              {isPreLaunch 
                ? "Junte-se ao nosso programa educacional premium e aprenda com especialistas do setor"
                : "Junte-se ao nosso programa educacional premium e aprenda com especialistas do setor"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-yellow-700 hover:bg-yellow-50 font-bold py-4 px-8 text-lg shadow-lg transform hover:scale-105 transition-all">
                <Play className="h-5 w-5 mr-2" />
                {isPreLaunch ? "Em Breve" : "Iniciar Teste Grátis"}
              </Button>
              <Button
                variant="outline"
                className="border-2 border-white bg-transparent text-white hover:bg-white/20 font-bold py-4 px-8 text-lg"
              >
                <Users className="h-5 w-5 mr-2" />
                {isPreLaunch ? "Ver Todos os Cursos" : "Ver Todos os Cursos"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
