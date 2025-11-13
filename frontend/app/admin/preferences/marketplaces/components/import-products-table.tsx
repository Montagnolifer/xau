"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, PackageSearch } from "lucide-react"
import type { MarketplaceImportProduct } from "@/lib/api/import-ml"
import { Button } from "@/components/ui/button"

type ImportProductsTableProps = {
  products: MarketplaceImportProduct[]
  selectedIds: Set<string>
  onToggle: (productId: string) => void
  loading: boolean
  error?: string | null
}

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
})

export function ImportProductsTable({
  products,
  selectedIds,
  onToggle,
  loading,
  error,
}: ImportProductsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
        <PackageSearch className="h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <PackageSearch className="h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          Nenhum produto encontrado para esta conta.
        </p>
        <p className="text-xs text-slate-500">
          Verifique se há itens ativos ou ajuste os filtros de busca.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[420px] rounded-lg border border-slate-100">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-16"></TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="w-28 text-right">Preço</TableHead>
            <TableHead className="w-32 text-right">Estoque</TableHead>
            <TableHead className="w-36">Status</TableHead>
            <TableHead className="w-28 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isSelected = selectedIds.has(product.id)
            return (
              <TableRow
                key={product.id}
                data-state={isSelected ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => onToggle(product.id)}
              >
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(product.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.thumbnail ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-white">
                        <img
                          src={product.thumbnail}
                          alt={product.title ?? "Produto"}
                          className="h-12 w-12 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-400">
                        <PackageSearch className="h-5 w-5" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        {product.title}
                      </p>
                      <p className="text-xs text-slate-500">ID: {product.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-slate-700">
                  {numberFormatter.format(product.price)}
                </TableCell>
                <TableCell className="text-right text-sm text-slate-600">
                  {product.availableQuantity}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {product.status ?? "Desconhecido"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {product.permalink ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-slate-800"
                      onClick={(event) => {
                        event.stopPropagation()
                        window.open(product.permalink ?? "#", "_blank", "noopener,noreferrer")
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

