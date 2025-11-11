import { BaseApiClient } from './base-client'
import {
  CategoryFlatNode,
  CategoryTreeNode,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/types/category'

export class CategoriesApi extends BaseApiClient {
  async getCategoriesTree(): Promise<CategoryTreeNode[]> {
    return this.request<CategoryTreeNode[]>('/categories', {
      method: 'GET',
    })
  }

  async getCategoriesFlat(): Promise<CategoryFlatNode[]> {
    return this.request<CategoryFlatNode[]>('/categories/flat', {
      method: 'GET',
    })
  }

  async getCategory(id: number): Promise<CategoryFlatNode> {
    return this.request<CategoryFlatNode>(`/categories/${id}`, {
      method: 'GET',
    })
  }

  async createCategory(payload: CreateCategoryPayload) {
    return this.authenticatedRequest<CategoryTreeNode>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateCategory(id: number, payload: UpdateCategoryPayload) {
    return this.authenticatedRequest<CategoryTreeNode>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  async deleteCategory(id: number) {
    return this.authenticatedRequest<void>(`/categories/${id}`, {
      method: 'DELETE',
    })
  }
}

