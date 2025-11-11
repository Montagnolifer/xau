import type { Product } from "@/types/product"
import { apiClient } from "@/lib/api"
import { transformBackendProduct } from "@/lib/utils"

export async function getProducts(): Promise<Product[]> {
  const backendProducts = await apiClient.getProducts()
  return backendProducts.map(transformBackendProduct)
}
