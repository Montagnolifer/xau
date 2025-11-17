"use client"

import type {
  MarketplaceImportListResponse,
  MarketplaceImportProduct,
} from "@/lib/api/shopee/import-shopee"

export type ShopeeProductRow = MarketplaceImportProduct & {
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

export function mapShopeeProductsResponse(
  response: MarketplaceImportListResponse,
): ShopeeProductRow[] {
  const products = response.products ?? []

  return products.map((product) => ({
    ...product,
    searchIndex: buildSearchIndex(product),
  }))
}

