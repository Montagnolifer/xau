"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  ChevronDown,
  ChevronRight,
  Edit,
  FolderPlus,
  Layers,
  RefreshCcw,
  Search,
  Trash2,
  TreePine,
  Plus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { CategoryTreeNode } from "@/types/category"

const flattenTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
  const result: CategoryTreeNode[] = []

  const traverse = (items: CategoryTreeNode[]) => {
    for (const item of items) {
      result.push(item)
      if (item.children?.length) {
        traverse(item.children)
      }
    }
  }

  traverse(nodes)
  return result
}

const filterTree = (nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] => {
  const term = query.trim().toLowerCase()
  if (!term) {
    return nodes
  }

  const filterRecursive = (items: CategoryTreeNode[]): CategoryTreeNode[] => {
    const filtered: CategoryTreeNode[] = []

    for (const item of items) {
      const matches =
        item.name.toLowerCase().includes(term) ||
        item.slug.toLowerCase().includes(term) ||
        item.path.join(" / ").toLowerCase().includes(term)

      const filteredChildren = filterRecursive(item.children ?? [])
      if (matches || filteredChildren.length) {
        filtered.push({
          ...item,
          children: filteredChildren,
        })
      }
    }

    return filtered
  }

  return filterRecursive(nodes)
}

const collectIds = (nodes: CategoryTreeNode[]): number[] => {
  const ids: number[] = []
  const stack = [...nodes]

  while (stack.length) {
    const current = stack.pop()!
    ids.push(current.id)
    if (current.children?.length) {
      stack.push(...current.children)
    }
  }

  return ids
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryTreeNode | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const loadCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getCategoriesTree()
      setCategories(data)
      setExpandedNodes(new Set(collectIds(data)))
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
      setError("Não foi possível carregar as categorias.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const filteredCategories = useMemo(
    () => filterTree(categories, searchTerm),
    [categories, searchTerm],
  )

  const stats = useMemo(() => {
    const flattened = flattenTree(categories)
    const total = flattened.length
    const active = flattened.filter((category) => category.status).length
    const roots = categories.length
    const subcategories = Math.max(total - roots, 0)

    return {
      total,
      active,
      roots,
      subcategories,
    }
  }, [categories])

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteClick = (category: CategoryTreeNode) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    setDeleting(true)
    try {
      await apiClient.deleteCategory(categoryToDelete.id)
      toast({
        title: "Categoria excluída",
        description: `A categoria "${categoryToDelete.name}" foi removida.`,
      })
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      await loadCategories()
    } catch (err) {
      console.error("Erro ao excluir categoria:", err)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a categoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const renderCategory = (category: CategoryTreeNode, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = searchTerm ? true : expandedNodes.has(category.id)

    return (
      <div key={category.id} className="space-y-2">
        <div
          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between"
          style={{ marginLeft: depth * 20 }}
        >
          <div className="flex flex-1 items-start gap-3">
            {hasChildren ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toggleNode(category.id)}
                className="mt-1 h-8 w-8 border border-slate-200"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )}
              </Button>
            ) : (
              <span className="mt-2 h-8 w-8" />
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-slate-900">
                  {category.name}
                </span>
                <Badge variant="outline" className="bg-slate-50 text-xs font-medium text-slate-600">
                  {category.path.join(" / ")}
                </Badge>
              </div>
              {category.description && (
                <p className="text-sm text-slate-600">{category.description}</p>
              )}
              <p className="text-xs text-slate-400">Slug: {category.slug}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                category.status
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }
            >
              {category.status ? "Ativa" : "Inativa"}
            </Badge>
            <Link href={`/admin/category/novo?parentId=${category.id}`}>
              <Button variant="outline" size="sm" className="gap-2 border-slate-300">
                <FolderPlus className="h-4 w-4" />
                Subcategoria
              </Button>
            </Link>
            <Link href={`/admin/category/novo?id=${category.id}`}>
              <Button variant="outline" size="sm" className="gap-2 border-slate-300">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleDeleteClick(category)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {category.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categorias</h1>
          <p className="text-slate-600">
            Organize sua árvore de categorias e subcategorias sem limites de profundidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-slate-300"
            onClick={loadCategories}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Link href="/admin/category/novo">
            <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Categorias</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3">
                <TreePine className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Categorias Ativas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3">
                <Layers className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Subcategorias</p>
                <p className="text-2xl font-bold text-slate-900">{stats.subcategories}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3">
                <FolderPlus className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar categorias por nome ou caminho..."
              className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center text-slate-500">Carregando categorias...</CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center text-red-500">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && filteredCategories.length === 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center">
            <p className="text-lg font-semibold text-slate-900">Nenhuma categoria encontrada</p>
            <p className="mt-2 text-sm text-slate-500">
              Ajuste sua busca ou crie uma nova categoria para começar.
            </p>
            <Link href="/admin/category/novo">
              <Button className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Nova Categoria
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filteredCategories.length > 0 && (
        <div className="space-y-4">
          {filteredCategories.map((category) => renderCategory(category))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir a categoria "{categoryToDelete?.name}"? Todas as subcategorias
              também serão removidas. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

