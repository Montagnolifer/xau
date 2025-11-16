"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { CurrencyInputUSD } from "@/components/ui/currency-input-usd"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, Save, Eye, Plus, Trash2, X, ChevronDown } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import type { CategoryFlatNode } from "@/types/category"
import { config } from "@/lib/config"

type ImageType = { id: string; file: File; preview: string; isMain?: boolean }

const normalizeProductImages = (images: any): string[] => {
  if (!images) {
    return []
  }

  if (!Array.isArray(images)) {
    return []
  }

  const mapped = images
    .map((image: any, index: number) => {
      if (typeof image === "string") {
        return { url: image, isMain: index === 0, position: index }
      }

      if (image && typeof image === "object" && typeof image.url === "string") {
        const isMain = Boolean((image as { isMain?: boolean }).isMain)
        const position =
          typeof (image as { position?: number }).position === "number"
            ? (image as { position?: number }).position!
            : index

        return {
          url: image.url as string,
          isMain,
          position,
        }
      }

      return null
    })
    .filter((item): item is { url: string; isMain: boolean; position: number } => item !== null)

  if (mapped.some((item) => item.isMain)) {
    mapped.sort((a, b) => Number(b.isMain) - Number(a.isMain))
  } else if (mapped.some((item) => typeof item.position === "number")) {
    mapped.sort((a, b) => a.position - b.position)
  }

  const unique: string[] = []
  for (const item of mapped) {
    if (!unique.includes(item.url)) {
      unique.push(item.url)
    }
  }

  return unique
}

function ImageUploader({ 
  images, 
  setImages, 
  existingImages = [], 
  setExistingImages 
}: {
  images: ImageType[];
  setImages: React.Dispatch<React.SetStateAction<ImageType[]>>;
  existingImages?: string[];
  setExistingImages?: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter((file: File) => {
      const isValidType = file.type.startsWith("image/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    const newImages = validFiles.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      isMain: false,
    }))

    setImages((prev: ImageType[]) => {
      const combined = [...prev, ...newImages]
      return combined.map((img, index) => ({
        ...img,
        isMain: index === 0,
      }))
    })
  }

  const removeImage = (id: string) => {
    setImages((prev: ImageType[]) => {
      const imageToRemove = prev.find((img: ImageType) => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      const filtered = prev.filter((img: ImageType) => img.id !== id)
      return filtered.map((img, index) => ({
        ...img,
        isMain: index === 0,
      }))
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const setMainExistingImage = (index: number) => {
    if (!setExistingImages) return

    setExistingImages((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev
      }
      const selected = prev[index]
      const others = prev.filter((_, i) => i !== index)
      return [selected, ...others]
    })
  }

  const setMainNewImage = (imageId: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === imageId)
      if (!target) {
        return prev
      }
      const others = prev.filter((img) => img.id !== imageId)
      const reordered = [{ ...target, isMain: true }, ...others.map((img) => ({ ...img, isMain: false }))]
      return reordered
    })
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <div>
          <Button type="button" variant="outline" className="mb-2">
            Selecionar Imagens
          </Button>
          <p className="text-sm text-slate-500">PNG, JPG até 10MB cada</p>
          <p className="text-xs text-slate-400 mt-1">Recomendado: 800x800px</p>
          <p className="text-xs text-slate-400 mt-2">Ou arraste e solte as imagens aqui</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Images Preview */}
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Imagens Existentes</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {existingImages.map((image, index) => {
              const imageSrc = image.startsWith("http") ? image : `${config.api.baseUrl}${image}`

              return (
                <div key={`${image}-${index}`} className="relative group">
                <div className="aspect-square bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                  <img
                      src={imageSrc}
                    alt={`Imagem existente ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                    {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                        onClick={() => setMainExistingImage(index)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Principal
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (setExistingImages) {
                          setExistingImages(prev => prev.filter((_, i) => i !== index))
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index === 0 ? "Principal" : `${index + 1}`}
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}

      {/* New Images */}
      {images.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Novas Imagens</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image: ImageType, index: number) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                  <img
                    src={image.preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setMainNewImage(image.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Principal
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(image.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index === 0 ? "Principal" : `${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Info */}
      {(images.length > 0 || existingImages.length > 0) && (
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-200">
          <span>{images.length + existingImages.length} imagem(ns) total</span>
          <span>Primeira imagem será a principal</span>
        </div>
      )}
    </div>
  )
}

export default function NewProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('id')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [isBasicOpen, setIsBasicOpen] = useState(true)
  const [isPricingOpen, setIsPricingOpen] = useState(true)
  const [isVariationsOpen, setIsVariationsOpen] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    wholesalePrice: "",
    priceUSD: "",
    wholesalePriceUSD: "",
    categoryId: "",
    stock: "",
    status: true,
    sku: "",
    weight: "",
    dimensions: "",
    youtubeUrl: "",
  })
  const [images, setImages] = useState<Array<{ id: string; file: File; preview: string; isMain?: boolean }>>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [variations, setVariations] = useState<
    Array<{
      name: string
      options: string[]
    }>
  >([])
  const [variantItems, setVariantItems] = useState<
    Array<{
      id: string
      options: Record<string, string>
      sku?: string
      price: string
      wholesalePrice?: string
      priceUSD?: string
      wholesalePriceUSD?: string
      stock: string
    }>
  >([])
  const hasVariations = variations.length > 0 && variations.every(v => v.name.trim().length > 0 && v.options.length > 0)

  const stringifyOptionsKey = (options: Record<string, string>) => {
    // Chave determinística baseada em nomes de eixos ordenados
    const entries = Object.entries(options).sort(([a], [b]) => a.localeCompare(b))
    return entries.map(([k, v]) => `${k}=${v}`).join('|')
  }

  const cartesianProduct = (arrays: string[][]): string[][] => {
    if (arrays.length === 0) return []
    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
      [[]],
    )
  }

  const regenerateVariantItems = () => {
    if (!hasVariations) {
      setVariantItems([])
      return
    }

    const axisNames = variations.map(v => v.name.trim())
    const optionsPerAxis = variations.map(v => v.options.filter(Boolean))
    const combos = cartesianProduct(optionsPerAxis)

    // Mapa atual para preservar valores
    const currentMap = new Map<string, (typeof variantItems)[number]>()
    for (const item of variantItems) {
      currentMap.set(stringifyOptionsKey(item.options), item)
    }

    const next: typeof variantItems = combos.map((values) => {
      const options: Record<string, string> = {}
      axisNames.forEach((axis, idx) => {
        options[axis] = values[idx]
      })
      const key = stringifyOptionsKey(options)
      const existing = currentMap.get(key)
      if (existing) {
        return existing
      }
      return {
        id: Math.random().toString(36).slice(2),
        options,
        sku: '',
        price: '',
        wholesalePrice: '',
        priceUSD: '',
        wholesalePriceUSD: '',
        stock: '0',
      }
    })

    setVariantItems(next)
  }
  const formatCategoryLabel = (category: CategoryFlatNode) => {
    if (category.path && Array.isArray(category.path) && category.path.length > 0) {
      return category.path.join(" > ")
    }
    return category.name
  }

  const [availableCategories, setAvailableCategories] = useState<CategoryFlatNode[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoadingCategories(true)
    setCategoriesError(null)

    apiClient
      .getCategoriesFlat()
      .then((data) => {
        if (!isMounted) return
        const activeCategories = (data || []).filter((category) => category.status !== false)
        setAvailableCategories(activeCategories)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error("Erro ao carregar categorias:", error)
        setCategoriesError("Não foi possível carregar as categorias cadastradas.")
      })
      .finally(() => {
        if (!isMounted) return
        setLoadingCategories(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Carregar dados do produto se for edição
  useEffect(() => {
    if (productId) {
      setIsEditing(true)
      setLoadingProduct(true)
      
      apiClient.getProduct(parseInt(productId))
        .then((product) => {
          setFormData({
            name: product.name || "",
            description: product.description || "",
            price: product.price?.toString() || "",
            wholesalePrice: product.wholesalePrice?.toString() || "",
            priceUSD: product.priceUSD?.toString() || "",
            wholesalePriceUSD: product.wholesalePriceUSD?.toString() || "",
            categoryId: (() => {
              const idFromResponse =
                typeof product.categoryId === "number"
                  ? product.categoryId
                  : product.categoryEntity?.id
              return idFromResponse ? idFromResponse.toString() : ""
            })(),
            stock: product.stock?.toString() || "",
            status: product.status ?? true,
            sku: product.sku || "",
            weight: product.weight?.toString() || "",
            dimensions: product.dimensions || "",
            youtubeUrl: product.youtubeUrl || "",
          })
          
          if (product.variations) {
            setVariations(product.variations.map((v: any) => ({
              name: v.name,
              options: v.options || []
            })))
          }
          
          // Carregar imagens existentes
          setExistingImages(normalizeProductImages(product.images))
        })
        .catch((err) => {
          console.error('Erro ao carregar produto:', err)
          // Redirecionar para lista se produto não encontrado
          router.push('/admin/produtos')
        })
        .finally(() => {
          setLoadingProduct(false)
        })
    }
  }, [productId, router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: value,
    }))
  }

  const addVariation = () => {
    setVariations([...variations, { name: "", options: [""] }])
    // Gerar combinações após tick
    setTimeout(regenerateVariantItems, 0)
  }

  const updateVariationName = (index: number, name: string) => {
    const newVariations = [...variations]
    newVariations[index].name = name
    setVariations(newVariations)
    regenerateVariantItems()
  }

  const addVariationOption = (variationIndex: number) => {
    const newVariations = [...variations]
    newVariations[variationIndex].options.push("")
    setVariations(newVariations)
    regenerateVariantItems()
  }

  const updateVariationOption = (variationIndex: number, optionIndex: number, value: string) => {
    const newVariations = [...variations]
    newVariations[variationIndex].options[optionIndex] = value
    setVariations(newVariations)
    regenerateVariantItems()
  }

  const removeVariationOption = (variationIndex: number, optionIndex: number) => {
    const newVariations = [...variations]
    newVariations[variationIndex].options = newVariations[variationIndex].options.filter((_, i) => i !== optionIndex)
    setVariations(newVariations)
    regenerateVariantItems()
  }

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index))
    setTimeout(regenerateVariantItems, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validações básicas
    if (!formData.name.trim()) {
      alert("Nome do produto é obrigatório");
      setIsLoading(false);
      return;
    }
    
    if (!formData.categoryId) {
      alert("Categoria é obrigatória");
      setIsLoading(false);
      return;
    }
    
    // Derivar agregados quando houver combinações
    let basePrice = parseFloat(formData.price)
    let baseStock = parseInt(formData.stock)
    const isComboMode = hasVariations && variantItems.length > 0
    if (isComboMode) {
      const prices = variantItems
        .map(i => parseFloat(i.price))
        .filter((n) => !Number.isNaN(n) && n >= 0)
      const stocks = variantItems
        .map(i => parseInt(i.stock))
        .filter((n) => !Number.isNaN(n) && n >= 0)

      if (prices.length === 0) {
        alert("Informe ao menos um preço válido nas combinações")
        setIsLoading(false);
        return;
      }
      if (stocks.length === 0) {
        alert("Informe ao menos um estoque válido nas combinações")
        setIsLoading(false);
        return;
      }

      basePrice = Math.min(...prices)
      baseStock = stocks.reduce((a, b) => a + b, 0)
    } else {
      // Validar preço base
      if (Number.isNaN(basePrice) || basePrice < 0) {
        alert("Preço deve ser um número válido maior ou igual a zero");
        setIsLoading(false);
        return;
      }
      // Validar estoque base
      if (Number.isNaN(baseStock) || baseStock < 0) {
        alert("Estoque deve ser um número válido maior ou igual a zero");
        setIsLoading(false);
        return;
      }
    }
    
    const data = new FormData();
    
    // Validar preço em dólar
    const priceUSD = formData.priceUSD ? parseFloat(formData.priceUSD) : undefined;
    if (formData.priceUSD && (isNaN(priceUSD!) || priceUSD! < 0)) {
      alert("Preço em dólar deve ser um número válido maior ou igual a zero");
      setIsLoading(false);
      return;
    }
    
    // Validar preço de atacado em dólar
    const wholesalePriceUSD = formData.wholesalePriceUSD ? parseFloat(formData.wholesalePriceUSD) : undefined;
    if (formData.wholesalePriceUSD && (isNaN(wholesalePriceUSD!) || wholesalePriceUSD! < 0)) {
      alert("Preço de atacado em dólar deve ser um número válido maior ou igual a zero");
      setIsLoading(false);
      return;
    }
    
    const selectedCategory = availableCategories.find(
      (category) => category.id === Number(formData.categoryId)
    );

    if (!selectedCategory) {
      alert("Categoria selecionada é inválida");
      setIsLoading(false);
      return;
    }

    const categoryLabel = selectedCategory.path?.length
      ? selectedCategory.path.join(" > ")
      : selectedCategory.name;

    // Adicionar dados validados
    data.append("name", formData.name.trim());
    data.append("description", formData.description || "");
    data.append("price", basePrice.toString());
    data.append("wholesalePrice", formData.wholesalePrice || "");
    data.append("priceUSD", priceUSD?.toString() || "");
    data.append("wholesalePriceUSD", wholesalePriceUSD?.toString() || "");
    data.append("categoryId", selectedCategory.id.toString());
    data.append("category", categoryLabel);
    data.append("stock", baseStock.toString());
    data.append("status", formData.status.toString());
    data.append("sku", formData.sku || "");
    data.append("weight", formData.weight || "");
    data.append("dimensions", formData.dimensions || "");
    data.append("youtubeUrl", formData.youtubeUrl || "");
    // Enviar eixos (retrocompat: também mantém 'variations')
    data.append("variations", JSON.stringify(variations));
    data.append("variationAxes", JSON.stringify(variations));
    data.append("variantItems", JSON.stringify(variantItems));
    
    // Enviar informações sobre imagens existentes que devem ser mantidas
    if (isEditing) {
      data.append("existingImages", JSON.stringify(existingImages))
    }
    
    images.forEach((img) => {
      data.append("images", img.file)
    })

    try {
      if (isEditing && productId) {
        await apiClient.updateProduct(parseInt(productId), data)
      } else {
        await apiClient.createProduct(data)
      }
      router.push("/admin/produtos")
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert("Erro ao salvar produto: " + (err instanceof Error ? err.message : 'Erro desconhecido'))
    } finally {
      setIsLoading(false)
    }
  }

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/produtos">
            <Button variant="outline" size="sm" className="border-slate-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEditing ? "Editar Produto" : "Novo Produto"}
            </h1>
            <p className="text-slate-600 mt-1">
              {isEditing ? "Edite as informações do produto" : "Adicione um novo produto ao seu catálogo"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-slate-300">
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4 grid grid-cols-[1fr_auto] items-center">
                <div>
                  <CardTitle className="text-slate-900">Informações Básicas</CardTitle>
                  <CardDescription>Dados principais do produto</CardDescription>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsBasicOpen(v => !v)} className="text-slate-600 ml-2">
                  <ChevronDown className={"h-4 w-4 transition-transform " + (isBasicOpen ? "rotate-180" : "")} />
                </Button>
              </CardHeader>
              {isBasicOpen && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">
                      Nome do Produto *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ex: iPhone 15 Pro Max 256GB"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku" className="text-slate-700 font-medium">
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      type="text"
                      placeholder="Ex: IPH15PM256"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-slate-700 font-medium">
                      Categoria *
                    </Label>
                    <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                      <SelectTrigger
                        className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        disabled={loadingCategories || availableCategories.length === 0}
                      >
                        <SelectValue
                          placeholder={
                            loadingCategories
                              ? "Carregando categorias..."
                              : availableCategories.length === 0
                                ? "Nenhuma categoria disponível"
                                : "Selecione uma categoria"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {formatCategoryLabel(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categoriesError && (
                      <p className="text-xs text-red-500 mt-2">{categoriesError}</p>
                    )}
                    {!loadingCategories && !categoriesError && availableCategories.length === 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        Nenhuma categoria cadastrada. Cadastre uma categoria antes de continuar.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva as características e benefícios do produto..."
                    rows={4}
                    className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="youtubeUrl" className="text-slate-700 font-medium">
                    Vídeo do YouTube
                  </Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.youtubeUrl}
                    onChange={(e) => handleInputChange("youtubeUrl", e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Cole o link completo do vídeo no YouTube para demonstração do produto
                  </p>
                </div>
              </CardContent>
              )}
            </Card>

            {/* Pricing & Inventory */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4 grid grid-cols-[1fr_auto] items-center">
                <div>
                  <CardTitle className="text-slate-900">Preço e Estoque</CardTitle>
                  <CardDescription>Configurações de preço e inventário</CardDescription>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsPricingOpen(v => !v)} className="text-slate-600 ml-2">
                  <ChevronDown className={"h-4 w-4 transition-transform " + (isPricingOpen ? "rotate-180" : "")} />
                </Button>
              </CardHeader>
              {isPricingOpen && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="price" className="text-slate-700 font-medium">
                      Preço (R$) *
                    </Label>
                    <CurrencyInput
                      id="price"
                      placeholder="0,00"
                      className="mt-2"
                      value={formData.price}
                      onChange={(value) => handleInputChange("price", value)}
                      disabled={hasVariations && variantItems.length > 0}
                      required
                    />
                    {hasVariations && variantItems.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">Preço base desativado (usando preço por combinação)</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="wholesalePrice" className="text-slate-700 font-medium">
                      Preço de Atacado (R$)
                    </Label>
                    <CurrencyInput
                      id="wholesalePrice"
                      placeholder="0,00"
                      className="mt-2"
                      value={formData.wholesalePrice}
                      onChange={(value) => handleInputChange("wholesalePrice", value)}
                      disabled={hasVariations && variantItems.length > 0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="priceUSD" className="text-slate-700 font-medium">
                      Preço (USD)
                    </Label>
                    <CurrencyInputUSD
                      id="priceUSD"
                      placeholder="0.00"
                      className="mt-2"
                      value={formData.priceUSD}
                      onChange={(value) => handleInputChange("priceUSD", value)}
                      disabled={hasVariations && variantItems.length > 0}
                    />
                  </div>

                  <div>
                    <Label htmlFor="wholesalePriceUSD" className="text-slate-700 font-medium">
                      Preço de Atacado (USD)
                    </Label>
                    <CurrencyInputUSD
                      id="wholesalePriceUSD"
                      placeholder="0.00"
                      className="mt-2"
                      value={formData.wholesalePriceUSD}
                      onChange={(value) => handleInputChange("wholesalePriceUSD", value)}
                      disabled={hasVariations && variantItems.length > 0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="stock" className="text-slate-700 font-medium">
                      Quantidade em Estoque *
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.stock}
                      onChange={(e) => handleInputChange("stock", e.target.value)}
                      disabled={hasVariations && variantItems.length > 0}
                      required
                    />
                    {hasVariations && variantItems.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">Estoque base desativado (usando estoque por combinação)</p>
                    )}
                  </div>
                </div>
              </CardContent>
              )}
            </Card>

            {/* Shipping 
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900">Informações de Envio</CardTitle>
                <CardDescription>Dados para cálculo de frete</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="weight" className="text-slate-700 font-medium">
                      Peso (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dimensions" className="text-slate-700 font-medium">
                      Dimensões (cm)
                    </Label>
                    <Input
                      id="dimensions"
                      type="text"
                      placeholder="Ex: 15x8x1"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange("dimensions", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>*/}

            {/* Product Variations */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4 grid grid-cols-[1fr_auto] items-center">
                <div>
                  <CardTitle className="text-slate-900">Variações do Produto</CardTitle>
                  <CardDescription>Configure diferentes opções como cor, tamanho, etc.</CardDescription>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsVariationsOpen(v => !v)} className="text-slate-600 ml-2">
                  <ChevronDown className={"h-4 w-4 transition-transform " + (isVariationsOpen ? "rotate-180" : "")} />
                </Button>
              </CardHeader>
              {isVariationsOpen && (
              <CardContent className="space-y-6">
                {variations.map((variation, variationIndex) => (
                  <div key={variationIndex} className="p-4 border border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Variação {variationIndex + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeVariation(variationIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor={`variation-name-${variationIndex}`}>Nome da Variação *</Label>
                      <Input
                        id={`variation-name-${variationIndex}`}
                        placeholder="Ex: Cor, Tamanho, Material"
                        value={variation.name}
                        onChange={(e) => updateVariationName(variationIndex, e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Opções da Variação</Label>
                      <div className="mt-2 space-y-2">
                        {variation.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Input
                              placeholder="Ex: Azul, Vermelho, P, M, G"
                              value={option}
                              onChange={(e) => updateVariationOption(variationIndex, optionIndex, e.target.value)}
                              className="flex-1"
                            />
                            {variation.options.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeVariationOption(variationIndex, optionIndex)}
                                className="text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addVariationOption(variationIndex)}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Opção
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addVariation}
                  className="w-full border-dashed border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Variação
                </Button>
                {hasVariations && variantItems.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-medium text-slate-900">Combinações</h4>
                    <div className="rounded-lg border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-8 gap-3 p-3 bg-slate-50 text-xs font-medium text-slate-600">
                        <div className="md:col-span-2">Opções</div>
                        <div>SKU</div>
                        <div>Preço</div>
                        <div>Atacado</div>
                        <div>USD</div>
                        <div>Atacado USD</div>
                        <div>Estoque</div>
                      </div>
                      <div className="divide-y divide-slate-200">
                        {variantItems.map((item, idx) => {
                          const optionsLabel = Object.entries(item.options)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')
                          const onChangeItem = (key: keyof typeof item, value: any) => {
                            setVariantItems((prev) => {
                              const clone = [...prev]
                              clone[idx] = { ...(clone[idx] || item), [key]: value }
                              return clone
                            })
                          }
                          return (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-3 p-3 items-center">
                              <div className="md:col-span-2 text-sm text-slate-700">{optionsLabel}</div>
                              <div>
                                <Input
                                  value={item.sku || ''}
                                  onChange={(e) => onChangeItem('sku', e.target.value)}
                                  placeholder="SKU"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Input
                                  value={item.price}
                                  onChange={(e) => onChangeItem('price', e.target.value)}
                                  placeholder="0,00"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Input
                                  value={item.wholesalePrice || ''}
                                  onChange={(e) => onChangeItem('wholesalePrice', e.target.value)}
                                  placeholder="0,00"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Input
                                  value={item.priceUSD || ''}
                                  onChange={(e) => onChangeItem('priceUSD', e.target.value)}
                                  placeholder="0.00"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Input
                                  value={item.wholesalePriceUSD || ''}
                                  onChange={(e) => onChangeItem('wholesalePriceUSD', e.target.value)}
                                  placeholder="0.00"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  value={item.stock}
                                  onChange={(e) => onChangeItem('stock', e.target.value)}
                                  placeholder="0"
                                  className="h-9"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900">Status</CardTitle>
                <CardDescription>Configurações de visibilidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="status" className="text-slate-700 font-medium">
                      Produto Ativo
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.status ? "Visível na loja" : "Oculto na loja"}
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

            {/* Product Images */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900">Imagens do Produto</CardTitle>
                <CardDescription>Adicione fotos do produto</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader images={images} setImages={setImages} existingImages={existingImages} setExistingImages={setExistingImages} />
              </CardContent>
            </Card>

            {/* SEO 
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900">SEO</CardTitle>
                <CardDescription>Otimização para buscadores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta-title" className="text-slate-700 font-medium">
                    Meta Título
                  </Label>
                  <Input
                    id="meta-title"
                    type="text"
                    placeholder="Título para SEO"
                    className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <Label htmlFor="meta-description" className="text-slate-700 font-medium">
                    Meta Descrição
                  </Label>
                  <Textarea
                    id="meta-description"
                    placeholder="Descrição para SEO"
                    rows={3}
                    className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </CardContent>
            </Card>*/}

            {/* YouTube Video Preview */}
            {formData.youtubeUrl && (
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-slate-900">Preview do Vídeo</CardTitle>
                  <CardDescription>Como o vídeo aparecerá no produto</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const videoId = getYouTubeVideoId(formData.youtubeUrl)
                    if (videoId) {
                      return (
                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video preview"
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )
                    } else {
                      return (
                        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-slate-500 text-center">
                            Link do YouTube inválido
                            <br />
                            <span className="text-xs">Verifique se o link está correto</span>
                          </p>
                        </div>
                      )
                    }
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
          <Link href="/admin/produtos">
            <Button type="button" variant="outline" className="border-slate-300">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading || loadingProduct}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
          >
            {isLoading || loadingProduct ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {loadingProduct ? "Carregando..." : "Salvando..."}
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Atualizar Produto" : "Salvar Produto"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
