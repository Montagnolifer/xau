"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, ShoppingCart } from "lucide-react"
import type { CategoryFlatNode } from "@/types/category"
import type { MarketplaceAccount } from "@/lib/api/marketplaces-api"
import { useMemo } from "react"

type ImportProductsToolbarProps = {
  account?: MarketplaceAccount
  fetchedAt?: string
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCount: number
  totalCount: number
  isAllSelected: boolean
  onToggleSelectAll: () => void
  categoryId?: string
  categories: CategoryFlatNode[]
  onCategoryChange: (value: string) => void
  onImport: () => void
  importing: boolean
  loadingProducts: boolean
  onRefresh: () => void
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

export function ImportProductsToolbar({
  account,
  fetchedAt,
  searchTerm,
  onSearchChange,
  selectedCount,
  totalCount,
  isAllSelected,
  onToggleSelectAll,
  categoryId,
  categories,
  onCategoryChange,
  onImport,
  importing,
  loadingProducts,
  onRefresh,
}: ImportProductsToolbarProps) {
  const lastSyncLabel = useMemo(() => {
    if (!fetchedAt) {
      return null
    }
    try {
      return dateFormatter.format(new Date(fetchedAt))
    } catch {
      return null
    }
  }, [fetchedAt])

  const providerLabel = useMemo(() => {
    if (!account?.provider) {
      return "Marketplace"
    }
    switch (account.provider) {
      case "mercado_livre":
        return "Mercado Livre"
      case "shopee":
        return "Shopee"
      default:
        return account.provider
    }
  }, [account?.provider])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              {providerLabel}
            </Badge>
            {account?.accountName ? (
              <span className="font-medium text-slate-700">{account.accountName}</span>
            ) : null}
            <span className="text-xs text-slate-400">ID externo: {account?.externalUserId}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSelectAll}
              disabled={totalCount === 0}
            >
              {isAllSelected ? "Limpar seleção" : "Selecionar todos"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loadingProducts}
            >
              {loadingProducts ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>
            {selectedCount > 0
              ? `${selectedCount} produto${selectedCount > 1 ? "s" : ""} selecionado${selectedCount > 1 ? "s" : ""}`
              : "Nenhum produto selecionado"}
          </span>
          <span>•</span>
          <span>{totalCount} resultado{totalCount === 1 ? "" : "s"} visível{totalCount === 1 ? "" : "s"}</span>
          {lastSyncLabel ? (
            <>
              <span>•</span>
              <span>Lista atualizada às {lastSyncLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título ou ID do produto"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select
            value={categoryId}
            onValueChange={onCategoryChange}
            disabled={!categories.length}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.path.length > 0
                    ? `${category.path.join(" / ")} / ${category.name}`
                    : category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={onImport}
          disabled={importing || selectedCount === 0}
        >
          {importing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Importar{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

