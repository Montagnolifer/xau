import { categoriesApi } from "@/lib/api"
import type { CategoryFlatNode } from "@/types/category"

export async function getCategories(): Promise<CategoryFlatNode[]> {
  try {
    return await categoriesApi.getCategoriesFlat()
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return []
  }
}

