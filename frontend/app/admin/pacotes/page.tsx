"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, Filter, Edit, Trash2, Star, Clock, Package2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { apiClient, PackageResponse, PackagesListResponse } from "@/lib/api"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function PackagesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [packages, setPackages] = useState<PackageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<PackageResponse | null>(null)
  const [deletingPackage, setDeletingPackage] = useState(false)

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true)
        setError(null)
        const response: PackagesListResponse = await apiClient.getPackagesAdmin()
        console.log('Resposta da API:', response)
        setPackages(response.data || [])
      } catch (err) {
        console.error('Erro ao buscar pacotes:', err)
        setError('Erro ao carregar os pacotes. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchPackages()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeletePackage = async (id: number) => {
    try {
      setDeletingPackage(true)
      console.log('Iniciando exclusão do pacote:', id)
      await apiClient.deletePackage(id)
      console.log('Pacote deletado com sucesso:', id)
      setPackages(packages.filter(pkg => pkg.id !== id))
      setPackageToDelete(null)
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error('Erro ao excluir pacote:', err)
      alert('Erro ao excluir o pacote. Tente novamente.')
    } finally {
      setDeletingPackage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Erro ao carregar pacotes</h3>
                <p className="text-red-600">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-2 bg-red-600 hover:bg-red-700"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pacotes</h1>
          <p className="text-slate-600 mt-1">Gerencie seus pacotes de serviços</p>
        </div>
        <Link href="/admin/pacotes/novo">
          <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Pacote
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Pacotes</p>
                <p className="text-2xl font-bold text-slate-900">{packages.length}</p>
              </div>
              <Package2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pacotes Ativos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {packages.filter((p) => p.status).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pacotes Inativos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {packages.filter((p) => !p.status).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">○</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar pacotes por nome ou categoria..."
                className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-slate-300">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packages List */}
      {filteredPackages.length === 0 ? (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center">
            <Package2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'Nenhum pacote encontrado' : 'Nenhum pacote cadastrado'}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchTerm
                ? 'Tente ajustar os termos de busca ou criar um novo pacote.'
                : 'Comece criando seu primeiro pacote de serviços.'
              }
            </p>
            {!searchTerm && (
              <Link href="/admin/pacotes/novo">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Pacote
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                        {pkg.category}
                      </Badge>
                      <Badge variant={pkg.status ? "default" : "secondary"}>
                        {pkg.status ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-slate-900 mb-2">{pkg.name}</CardTitle>
                    <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>

                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Entrega em {pkg.deliveryTime}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500 line-through">{formatPrice(pkg.originalPrice)}</p>
                    <p className="text-2xl font-bold text-slate-900">{formatPrice(pkg.currentPrice)}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Highlights */}
                {pkg.highlights && pkg.highlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                      <span className="text-pink-500 mr-2">✨</span>
                      Destaques do Pacote
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {pkg.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center text-sm text-slate-600">
                          <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {pkg.services && pkg.services.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                      <span className="text-pink-500 mr-2">●</span>
                      Serviços Inclusos ({pkg.services.length})
                    </h4>
                    <div className="space-y-2">
                      {pkg.services.slice(0, 2).map((service, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{service.name}</p>
                            <p className="text-xs text-slate-500">{service.description}</p>
                          </div>
                        </div>
                      ))}
                      {pkg.services.length > 2 && (
                        <p className="text-xs text-slate-500 pl-11">+{pkg.services.length - 2} serviços adicionais</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <Link href={`/admin/pacotes/novo?id=${pkg.id}`}>
                      <Button variant="outline" size="sm" className="border-slate-300">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeleteDialogOpen(true)
                        setPackageToDelete(pkg)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pacote <strong>"{packageToDelete?.name}"</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPackage}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (packageToDelete) {
                  handleDeletePackage(packageToDelete.id)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingPackage}
            >
              {deletingPackage ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
