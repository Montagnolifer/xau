"use client"

import type {
  MarketplaceImportListResponse,
  MarketplaceImportProduct,
} from "@/lib/api/import-ml"

export type MercadoLivreProductRow = MarketplaceImportProduct & {
  searchIndex: string
}

function buildSearchIndex(product: MarketplaceImportProduct): string {
  const base = [
    product.id ?? "",
    product.title ?? "",
    product.status ?? "",
  ]
    .join(" ")
    .toLowerCase()

  return base.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function mapMercadoLivreProductsResponse(
  response: MarketplaceImportListResponse,
): MercadoLivreProductRow[] {
  const products = response.products ?? []

  return products.map((product) => ({
    ...product,
    searchIndex: buildSearchIndex(product),
  }))
}

