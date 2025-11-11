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
} 