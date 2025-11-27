import { BaseApiClient } from './base-client';

export class ProductsApi extends BaseApiClient {
  async getProducts(): Promise<any[]> {
    return this.request<any[]>('/products');
  }

  async getProduct(id: number): Promise<any> {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(productData: FormData, images?: File[]): Promise<any> {
    return this.authenticatedFormDataRequest<any>('/products', productData);
  }

  async updateProduct(id: number, productData: FormData, images?: File[]): Promise<any> {
    return this.authenticatedFormDataRequest<any>(`/products/${id}`, productData, {
      method: 'PUT',
    });
  }

  async deleteProduct(id: number): Promise<{ message: string } | void> {
    return this.authenticatedRequest<{ message: string } | void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleFavorite(id: number): Promise<any> {
    return this.authenticatedRequest<any>(`/products/${id}/favorite`, {
      method: 'POST',
    });
  }

  async getFavorites(): Promise<any[]> {
    return this.request<any[]>('/products/favorites/list');
  }

  async importProductsFromXlsx(file: File): Promise<{
    total: number
    success: number
    failed: number
    results: Array<{
      reference: string
      success: boolean
      productId?: number
      error?: string
    }>
  }> {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.authenticatedFormDataRequest<any>('/products/import-xlsx', formData)
  }

  async downloadImportTemplate(): Promise<void> {
    const url = `${this.baseUrl}/products/import-template`
    
    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'template-importacao-produtos.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }
} 