"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { CategoryTreeNode, CategoryFlatNode } from "@/types/category"

type ParentOption = {
  id: number | null
  label: string
  depth: number
  path: string[]
  disabled?: boolean
}

const flattenWithDepth = (
  nodes: CategoryTreeNode[],
  depth = 0,
  parentPath: string[] = [],
): ParentOption[] => {
  const result: ParentOption[] = []

  for (const node of nodes) {
    const currentPath = [...parentPath, node.name]
    result.push({
      id: node.id,
      label: node.name,
      depth,
      path: currentPath,
    })
    if (node.children?.length) {
      result.push(...flattenWithDepth(node.children, depth + 1, currentPath))
    }
  }

  return result
}

const findNodeById = (nodes: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

const collectDescendantIds = (node: CategoryTreeNode | null): Set<number> => {
  const ids = new Set<number>()
  if (!node) return ids

  const stack = [...(node.children ?? [])]
  while (stack.length) {
    const current = stack.pop()!
    ids.add(current.id)
    if (current.children?.length) {
      stack.push(...current.children)
    }
  }
  return ids
}

export default function CategoryFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryIdParam = searchParams.get("id")
  const parentIdParam = searchParams.get("parentId")
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [currentCategory, setCurrentCategory] = useState<CategoryFlatNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    status: true,
    parentId: null as number | null,
    position: "",
  })
  const { toast } = useToast()

  const isEditing = Boolean(categoryIdParam)
  const categoryId = categoryIdParam ? Number(categoryIdParam) : null

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [tree, category] = await Promise.all([
          apiClient.getCategoriesTree(),
          categoryId ? apiClient.getCategory(categoryId) : Promise.resolve(null),
        ])

        setCategories(tree)

        if (category) {
          setCurrentCategory(category)
          setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            status: category.status,
            parentId: category.parentId ?? null,
            position: category.position !== null && category.position !== undefined ? String(category.position) : "",
          })
        } else if (parentIdParam) {
          setFormData((prev) => ({
            ...prev,
            parentId: Number(parentIdParam),
          }))
        }
      } catch (error) {
        console.error("Erro ao carregar dados da categoria:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as informações. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, parentIdParam])

  const descendantsIds = useMemo(() => {
    if (!categoryId) return new Set<number>()
    const node = findNodeById(categories, categoryId)
    return collectDescendantIds(node)
  }, [categories, categoryId])

  const parentOptions = useMemo<ParentOption[]>(() => {
    const baseOptions: ParentOption[] = [
      {
        id: null,
        label: "Categoria raiz",
        depth: 0,
        path: [],
      },
    ]

    const flattened = flattenWithDepth(categories)
    return baseOptions.concat(
      flattened.map((item) => ({
        ...item,
        disabled:
          item.id === categoryId ||
          (item.id !== null && descendantsIds.has(item.id)),
      })),
    )
  }, [categories, categoryId, descendantsIds])

  const selectedParentOption = parentOptions.find(
    (option) =>
      (option.id === null && (formData.parentId === null || formData.parentId === undefined)) ||
      option.id === formData.parentId,
  )

  const previewPath = useMemo(() => {
    const pathParts = selectedParentOption?.path ?? []
    if (!formData.name.trim()) {
      return pathParts.length ? `${pathParts.join(" / ")} / Nova categoria` : "Nova categoria"
    }
    return pathParts.length ? `${pathParts.join(" / ")} / ${formData.name.trim()}` : formData.name.trim()
  }, [selectedParentOption, formData.name])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe um nome para a categoria.",
        variant: "destructive",
      })
      return
    }

    let positionValue: number | null = null
    if (formData.position.trim()) {
      const parsed = Number(formData.position)
      if (Number.isNaN(parsed)) {
        toast({
          title: "Posição inválida",
          description: "Informe um número válido para o campo posição.",
          variant: "destructive",
        })
        return
      }
      positionValue = parsed
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      description: formData.description.trim() || undefined,
      status: formData.status,
      parentId: formData.parentId ?? null,
      position: positionValue ?? undefined,
    }

    setSaving(true)
    try {
      if (isEditing && categoryId) {
        await apiClient.updateCategory(categoryId, payload)
        toast({
          title: "Categoria atualizada",
          description: `A categoria "${formData.name}" foi atualizada com sucesso.`,
        })
      } else {
        await apiClient.createCategory(payload)
        toast({
          title: "Categoria criada",
          description: `A categoria "${formData.name}" foi criada com sucesso.`,
        })
      }
      router.push("/admin/category")
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a categoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/category">
            <Button variant="outline" size="sm" className="border-slate-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEditing ? "Editar Categoria" : "Nova Categoria"}
            </h1>
            <p className="text-slate-600 mt-1">
              {isEditing
                ? "Atualize as informações da categoria selecionada."
                : "Crie categorias e subcategorias ilimitadas para organizar sua loja."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900">Informações Básicas</CardTitle>
                <CardDescription>Defina os dados principais da categoria.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">
                      Nome da Categoria *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex: Sandálias"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.name}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, name: event.target.value }))
                      }
                      disabled={loading || saving}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug" className="text-slate-700 font-medium">
                      Slug (opcional)
                    </Label>
                    <Input
                      id="slug"
                      placeholder="ex: sandalias"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.slug}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, slug: event.target.value }))
                      }
                      disabled={loading || saving}
                    />
                  </div>

                  <div>
                    <Label htmlFor="position" className="text-slate-700 font-medium">
                      Posição (opcional)
                    </Label>
                    <Input
                      id="position"
                      type="number"
                      placeholder="0"
                      className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.position}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, position: event.target.value }))
                      }
                      disabled={loading || saving}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 font-medium">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva a categoria para facilitar a organização..."
                    rows={4}
                    className="mt-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    disabled={loading || saving}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900">Hierarquia</CardTitle>
                <CardDescription>Escolha onde esta categoria ficará na árvore.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Categoria Pai</Label>
                  <Select
                    value={
                      formData.parentId === null || formData.parentId === undefined
                        ? "root"
                        : String(formData.parentId)
                    }
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        parentId: value === "root" ? null : Number(value),
                      }))
                    }}
                    disabled={loading || saving}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Selecione a categoria pai" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((option) => (
                        <SelectItem
                          key={option.id ?? "root"}
                          value={option.id === null ? "root" : String(option.id)}
                          disabled={option.disabled}
                        >
                          <span
                            className="inline-block"
                            style={{ paddingLeft: option.depth * 16 }}
                          >
                            {option.id === null ? option.label : `• ${option.label}`}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditing && currentCategory && (
                    <p className="text-xs text-slate-500">
                      Atual:{" "}
                      {currentCategory.path.length > 1
                        ? currentCategory.path.slice(0, -1).join(" / ") || "Categoria raiz"
                        : "Categoria raiz"}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">Pré-visualização do caminho</p>
                  <p>{previewPath}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900">Status</CardTitle>
                <CardDescription>Controle a visibilidade da categoria.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="status" className="text-slate-700 font-medium">
                      Categoria ativa
                    </Label>
                    <p className="mt-1 text-sm text-slate-500">
                      {formData.status ? "Visível na loja" : "Oculta para os clientes"}
                    </p>
                  </div>
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, status: checked }))
                    }
                    disabled={loading || saving}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
            <Link href="/admin/category">
              <Button type="button" variant="outline" className="border-slate-300">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving || loading}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Salvando...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? "Atualizar Categoria" : "Salvar Categoria"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

