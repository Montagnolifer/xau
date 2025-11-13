"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MarketplaceAccount } from "@/lib/api/marketplaces-api"
import { ImportProductsToolbar } from "./import-products-toolbar"
import { ImportProductsTable } from "./import-products-table"
import { useImportProductsDialog } from "./use-import-products-dialog"
import { AlertCircle } from "lucide-react"

type ImportProductsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: MarketplaceAccount
  onFinished?: (imported: number) => void
}

export function ImportProductsDialog({
  open,
  onOpenChange,
  account,
  onFinished,
}: ImportProductsDialogProps) {
  const {
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
  } = useImportProductsDialog({
    open,
    account,
    onSuccess: (imported) => {
      onFinished?.(imported)
    },
  })

  const providerSupported = account?.provider === "mercado_livre"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl space-y-6">
        <DialogHeader>
          <DialogTitle>Importar produtos do marketplace</DialogTitle>
          <DialogDescription>
            Escolha os produtos da conta conectada para sincronizar com o seu catálogo interno.
          </DialogDescription>
        </DialogHeader>

        {!account ? (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-slate-600">
            <AlertCircle className="h-5 w-5 text-slate-400" />
            <p>Nenhuma conta selecionada. Selecione uma integração para continuar.</p>
          </div>
        ) : null}

        {account && !providerSupported ? (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <p>
              A importação de catálogo está disponível apenas para o Mercado Livre no momento.
              Selecione uma conta compatível.
            </p>
          </div>
        ) : null}

        {account && providerSupported ? (
          <div className="space-y-5">
            <ImportProductsToolbar
              account={account}
              fetchedAt={state.fetchedAt}
              searchTerm={state.searchTerm}
              onSearchChange={setSearchTerm}
              selectedCount={selectedCount}
              totalCount={totalCount}
              isAllSelected={isAllSelected}
              onToggleSelectAll={toggleSelectAll}
              categoryId={state.categoryId}
              categories={state.categories}
              onCategoryChange={setCategoryId}
              onImport={handleImport}
              importing={state.importing}
              loadingProducts={state.loadingProducts}
              onRefresh={refresh}
            />

            <ImportProductsTable
              products={state.filteredProducts}
              selectedIds={state.selectedIds}
              onToggle={toggleProductSelection}
              loading={state.loadingProducts}
              error={state.error}
            />

            {!hasProducts && !state.loadingProducts && !state.error ? (
              <p className="text-center text-xs text-slate-400">
                Não encontramos produtos para esta conta. Tente sincronizar novamente mais tarde.
              </p>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

