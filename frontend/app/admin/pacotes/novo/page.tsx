"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Trash2, Save, Upload, X } from "lucide-react"
import Link from "next/link"
import { apiClient, CreatePackageRequest, PackageResponse } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { config } from "@/lib/config"

export default function NewPackagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [packageId, setPackageId] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    originalPrice: "",
    currentPrice: "",
    deliveryTime: "",
    status: true,
  })

  const [highlights, setHighlights] = useState<string[]>([""])
  const [services, setServices] = useState<Array<{ name: string; description: string }>>([
    { name: "", description: "" },
  ])

  // Verificar se é edição baseado no parâmetro da URL
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setIsEditing(true)
      setPackageId(parseInt(id))
      loadPackageData(parseInt(id))
    }
  }, [searchParams])

  const loadPackageData = async (id: number) => {
    try {
      setIsLoadingData(true)
      const response = await apiClient.getPackageAdmin(id)
      const packageData = response.data
      
      // Preencher o formulário com os dados do pacote
      setFormData({
        name: packageData.name,
        description: packageData.description,
        category: packageData.category,
        originalPrice: packageData.originalPrice.toString(),
        currentPrice: packageData.currentPrice.toString(),
        deliveryTime: packageData.deliveryTime,
        status: packageData.status,
      })

      // Preencher highlights
      if (packageData.highlights && packageData.highlights.length > 0) {
        setHighlights(packageData.highlights)
      } else {
        setHighlights([""])
      }

      // Preencher serviços
      if (packageData.services && packageData.services.length > 0) {
        setServices(packageData.services)
      } else {
        setServices([{ name: "", description: "" }])
      }

      // Preencher preview da imagem se existir
      if (packageData.image) {
        setImagePreview(packageData.image)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do pacote:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do pacote",
        variant: "destructive",
      })
      router.push("/admin/pacotes")
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      })
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addHighlight = () => {
    setHighlights([...highlights, ""])
  }

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...highlights]
    newHighlights[index] = value
    setHighlights(newHighlights)
  }

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index))
  }

  const addService = () => {
    setServices([...services, { name: "", description: "" }])
  }

  const updateService = (index: number, field: string, value: string) => {
    const newServices = [...services]
    newServices[index] = { ...newServices[index], [field]: value }
    setServices(newServices)
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar se há pelo menos um serviço válido
      const validServices = services.filter((s) => s.name.trim() !== "" && s.description.trim() !== "")
      if (validServices.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um serviço válido",
          variant: "destructive",
        })
        return
      }

      // Validar se há pelo menos um destaque válido
      const validHighlights = highlights.filter((h) => h.trim() !== "")
      if (validHighlights.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um destaque",
          variant: "destructive",
        })
        return
      }

      const packageData: CreatePackageRequest = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        originalPrice: parseFloat(formData.originalPrice),
        currentPrice: parseFloat(formData.currentPrice),
        deliveryTime: formData.deliveryTime,
        status: formData.status,
        highlights: validHighlights,
        services: validServices,
      }

      console.log("Dados do pacote:", packageData)

      if (isEditing && packageId) {
        // Atualizar pacote existente
        await apiClient.updatePackage(packageId, packageData, selectedImage || undefined)
        toast({
          title: "Sucesso!",
          description: "Pacote atualizado com sucesso",
        })
      } else {
        // Criar novo pacote
        await apiClient.createPackage(packageData, selectedImage || undefined)
        toast({
          title: "Sucesso!",
          description: "Pacote criado com sucesso",
        })
      }

      router.push("/admin/pacotes")
    } catch (error) {
      console.error("Erro ao salvar pacote:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar pacote",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const categories = [
    "Branding",
    "Identidade Visual",
    "Marketing Digital",
    "Design Gráfico",
    "Desenvolvimento Web",
    "Consultoria",
  ]

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/pacotes">
          <Button variant="outline" size="sm" className="border-slate-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEditing ? "Editar Pacote" : "Novo Pacote"}
          </h1>
          <p className="text-slate-600 mt-1">
            {isEditing ? "Edite as informações do pacote" : "Crie um novo pacote de serviços"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Dados principais do pacote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">Nome do Pacote *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Mini Kit Branding Express"
                    className="mt-2"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o que está incluído no pacote..."
                    rows={3}
                    className="mt-2"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deliveryTime">Tempo de Entrega *</Label>
                    <Input
                      id="deliveryTime"
                      placeholder="Ex: 3-5 dias"
                      className="mt-2"
                      value={formData.deliveryTime}
                      onChange={(e) => handleInputChange("deliveryTime", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="originalPrice">Preço Original (R$) *</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="mt-2"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentPrice">Preço Atual (R$) *</Label>
                    <Input
                      id="currentPrice"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="mt-2"
                      value={formData.currentPrice}
                      onChange={(e) => handleInputChange("currentPrice", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Imagem do Pacote</CardTitle>
                <CardDescription>Adicione uma imagem representativa do pacote</CardDescription>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview.startsWith('data:') ? imagePreview : `${config.api.baseUrl}${imagePreview}`}
                        alt="Preview da imagem"
                        className="w-full h-64 object-cover rounded-lg border border-slate-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Trocar Imagem
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600 mb-2">
                      Arraste e solte uma imagem aqui, ou{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        clique para selecionar
                      </button>
                    </p>
                    <p className="text-sm text-slate-500">
                      PNG, JPG, JPEG até 5MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Highlights */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Destaques do Pacote</CardTitle>
                <CardDescription>Principais benefícios e características</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Ex: Economia de R$ 25"
                      value={highlight}
                      onChange={(e) => updateHighlight(index, e.target.value)}
                      className="flex-1"
                    />
                    {highlights.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHighlight(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addHighlight} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Destaque
                </Button>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Serviços Inclusos</CardTitle>
                <CardDescription>Liste todos os serviços que fazem parte do pacote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {services.map((service, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Serviço {index + 1}</h4>
                      {services.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome do Serviço *</Label>
                        <Input
                          placeholder="Ex: Logo Simples"
                          value={service.name}
                          onChange={(e) => updateService(index, "name", e.target.value)}
                          className="mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label>Descrição do Serviço *</Label>
                        <Textarea
                          placeholder="Ex: Design de logotipo profissional para sua marca"
                          value={service.description}
                          onChange={(e) => updateService(index, "description", e.target.value)}
                          className="mt-2"
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addService} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Serviço
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Configurações de visibilidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="status">Pacote Ativo</Label>
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.status ? "Visível para clientes" : "Oculto para clientes"}
                    </p>
                  </div>
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => handleInputChange("status", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Como o pacote aparecerá</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {imagePreview && (
                    <div>
                      <img
                        src={imagePreview.startsWith('data:') ? imagePreview : `${config.api.baseUrl}${imagePreview}`}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Nome:</span>
                    <p className="text-slate-600">{formData.name || "Nome do pacote"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Categoria:</span>
                    <p className="text-slate-600">{formData.category || "Categoria"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Preço:</span>
                    <p className="text-slate-600">
                      {formData.currentPrice ? `R$ ${formData.currentPrice}` : "R$ 0,00"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Entrega:</span>
                    <p className="text-slate-600">{formData.deliveryTime || "Tempo de entrega"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
          <Link href="/admin/pacotes">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? "Atualizando..." : "Salvando..."}
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Atualizar Pacote" : "Criar Pacote"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
