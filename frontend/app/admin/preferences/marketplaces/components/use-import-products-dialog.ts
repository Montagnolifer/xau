"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { MarketplaceAccount } from "@/lib/api/marketplaces-api"
import {
  importMlApi,
  type ImportMarketplaceProductsPayload,
} from "@/lib/api/import-ml"
import { categoriesApi } from "@/lib/api"
import type { CategoryFlatNode } from "@/types/category"
import { useToast } from "@/hooks/use-toast"
import {
  mapMercadoLivreProductsResponse,
  type MercadoLivreProductRow,
} from "@/lib/importers/ml-mapper"

type UseImportProductsDialogParams = {
  open: boolean
  account?: MarketplaceAccount
  onSuccess?: (imported: number) => void
}

type ImportProductsState = {
  products: MercadoLivreProductRow[]
  filteredProducts: MercadoLivreProductRow[]
  loadingProducts: boolean
  importing: boolean
  searchTerm: string
  selectedIds: Set<string>
  categoryId?: string
  categories: CategoryFlatNode[]
  error?: string | null
  fetchedAt?: string
}

const createInitialState = (): ImportProductsState => ({
  products: [],
  filteredProducts: [],
  loadingProducts: false,
  importing: false,
  searchTerm: "",
  selectedIds: new Set<string>(),
  categories: [],
  error: null,
})

export function useImportProductsDialog({
  open,
  account,
  onSuccess,
}: UseImportProductsDialogParams) {
  const [state, setState] = useState<ImportProductsState>(createInitialState)
  const { toast } = useToast()

  const resetState = useCallback(() => {
    setState((prev) => {
      const next = createInitialState()
      next.categories = prev.categories
      next.categoryId = prev.categoryId
      return next
    })
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getCategoriesFlat()
      setState((prev) => ({
        ...prev,
        categories: response,
        categoryId: response.length ? String(response[0].id) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao carregar categorias para importação:", error)
      toast({
        title: "Não foi possível carregar categorias",
        description:
          "Verifique sua conexão ou tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }, [toast])

  const fetchProducts = useCallback(async () => {
    if (!account || account.provider !== "mercado_livre") {
      return
    }

    setState((prev) => ({
      ...prev,
      loadingProducts: true,
      error: null,
    }))

    try {
      const response = await importMlApi.listProducts(account.id)
      setState((prev) => {
        const products = mapMercadoLivreProductsResponse(response)
        return {
          ...prev,
          products,
          filteredProducts: products,
          loadingProducts: false,
          fetchedAt: response.fetchedAt,
          selectedIds: new Set<string>(),
          searchTerm: "",
        }
      })
    } catch (error) {
      console.error("Erro ao listar produtos do marketplace:", error)
      setState((prev) => ({
        ...prev,
        loadingProducts: false,
        error:
          "Não foi possível carregar os produtos dessa conta. Tente novamente.",
      }))
    }
  }, [account])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }

    fetchCategories().catch((error) =>
      console.error("Erro carregando categorias:", error),
    )

    if (account?.provider === "mercado_livre") {
      fetchProducts().catch((error) =>
        console.error("Erro carregando produtos do marketplace:", error),
      )
    }
  }, [open, fetchCategories, fetchProducts, resetState])

  const setSearchTerm = useCallback((value: string) => {
    setState((prev) => {
      const normalized = value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      const filtered = prev.products.filter((product) =>
        product.searchIndex.includes(normalized),
      )
      return {
        ...prev,
        searchTerm: value,
        filteredProducts: filtered,
      }
    })
  }, [])

  const toggleProductSelection = useCallback((productId: string) => {
    setState((prev) => {
      const nextSelected = new Set(prev.selectedIds)
      if (nextSelected.has(productId)) {
        nextSelected.delete(productId)
      } else {
        nextSelected.add(productId)
      }
      return { ...prev, selectedIds: nextSelected }
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setState((prev) => {
      const filteredIds = prev.filteredProducts.map((product) => product.id)
      const hasAllSelected = filteredIds.every((id) =>
        prev.selectedIds.has(id),
      )

      const selectedIds = new Set(prev.selectedIds)

      if (hasAllSelected) {
        filteredIds.forEach((id) => selectedIds.delete(id))
      } else {
        filteredIds.forEach((id) => selectedIds.add(id))
      }

      return {
        ...prev,
        selectedIds,
      }
    })
  }, [])

  const setCategoryId = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      categoryId: value,
    }))
  }, [])

  const handleImport = useCallback(async () => {
    if (!account) {
      toast({
        title: "Conta indisponível",
        description: "Conecte uma conta antes de importar produtos.",
        variant: "destructive",
      })
      return
    }

    const selectedIds = Array.from(state.selectedIds)
    if (!selectedIds.length) {
      toast({
        title: "Selecione ao menos um produto",
        description:
          "Escolha os produtos que deseja importar antes de continuar.",
        variant: "destructive",
      })
      return
    }

    const categoryId = state.categoryId ? Number(state.categoryId) : undefined
    if (!categoryId) {
      toast({
        title: "Selecione uma categoria",
        description:
          "Escolha uma categoria para associar aos produtos importados.",
        variant: "destructive",
      })
      return
    }

    const categoryName =
      state.categories.find(
        (category) => String(category.id) === state.categoryId,
      )?.name ?? null

    const payload: ImportMarketplaceProductsPayload = {
      productIds: selectedIds,
      categoryId,
      categoryName,
    }

    setState((prev) => ({
      ...prev,
      importing: true,
    }))

    try {
      const response = await importMlApi.importProducts(account.id, payload)
      toast({
        title: "Importação concluída",
        description:
          response.failed > 0
            ? `Foram importados ${response.imported} produtos, mas ${response.failed} falharam.`
            : `Foram importados ${response.imported} produtos com sucesso.`,
      })
      onSuccess?.(response.imported)
      await fetchProducts()
    } catch (error) {
      console.error("Erro ao importar produtos do marketplace:", error)
      toast({
        title: "Não foi possível concluir a importação",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setState((prev) => ({
        ...prev,
        importing: false,
      }))
    }
  }, [
    account,
    fetchProducts,
    onSuccess,
    state.categoryId,
    state.categories,
    state.selectedIds,
    toast,
  ])

  const refresh = useCallback(() => {
    fetchProducts().catch((error) =>
      console.error("Erro ao atualizar produtos do marketplace:", error),
    )
  }, [fetchProducts])

  const selectedCount = state.selectedIds.size
  const totalCount = state.filteredProducts.length
  const hasProducts = state.products.length > 0

  const isAllSelected = useMemo(() => {
    if (!totalCount) {
      return false
    }
    return state.filteredProducts.every((product) =>
      state.selectedIds.has(product.id),
    )
  }, [state.filteredProducts, state.selectedIds, totalCount])

  return {
    account,
    state,
    selectedCount,
    totalCount,
    isAllSelected,
    hasProducts,
    setSearchTerm,
    toggleProductSelection,
    toggleSelectAll,
    setCategoryId,
    handleImport,
    refresh,
  }
}

