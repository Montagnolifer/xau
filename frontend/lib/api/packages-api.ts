import { BaseApiClient } from './base-client';

// Interfaces para pacotes
export interface CreatePackageRequest {
  name: string;
  description: string;
  category: string;
  originalPrice: number;
  currentPrice: number;
  deliveryTime: string;
  image?: string;
  status?: boolean;
  highlights?: string[];
  services?: Array<{ name: string; description: string }>;
}

export interface PackageResponse {
  id: number;
  name: string;
  description: string;
  category: string;
  originalPrice: number;
  currentPrice: number;
  deliveryTime: string;
  image?: string;
  status: boolean;
  highlights: string[];
  services: Array<{ name: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageResponse {
  message: string;
  data: PackageResponse;
}

export interface PackagesListResponse {
  message: string;
  data: PackageResponse[];
}

export class PackagesApi extends BaseApiClient {
  async createPackage(packageData: CreatePackageRequest, imageFile?: File): Promise<CreatePackageResponse> {
    const formData = new FormData();
    
    // Adicionar dados do pacote
    formData.append('name', packageData.name);
    formData.append('description', packageData.description);
    formData.append('category', packageData.category);
    formData.append('originalPrice', packageData.originalPrice.toString());
    formData.append('currentPrice', packageData.currentPrice.toString());
    formData.append('deliveryTime', packageData.deliveryTime);
    formData.append('status', packageData.status?.toString() || 'true');
    
    if (packageData.highlights) {
      formData.append('highlights', JSON.stringify(packageData.highlights));
    }
    
    if (packageData.services) {
      formData.append('services', JSON.stringify(packageData.services));
    }
    
    // Adicionar imagem se fornecida
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.authenticatedFormDataRequest<CreatePackageResponse>('/packages', formData);
  }

  async getPackages(): Promise<PackagesListResponse> {
    return this.request<PackagesListResponse>('/packages');
  }

  async getPackagesAdmin(): Promise<PackagesListResponse> {
    return this.authenticatedRequest<PackagesListResponse>('/packages/admin');
  }

  async getPackage(id: number): Promise<CreatePackageResponse> {
    return this.request<CreatePackageResponse>(`/packages/${id}`);
  }

  async getPackageAdmin(id: number): Promise<CreatePackageResponse> {
    return this.authenticatedRequest<CreatePackageResponse>(`/packages/admin/${id}`);
  }

  async updatePackage(id: number, packageData: Partial<CreatePackageRequest>, imageFile?: File): Promise<CreatePackageResponse> {
    const formData = new FormData();
    
    // Adicionar dados do pacote
    if (packageData.name) formData.append('name', packageData.name);
    if (packageData.description) formData.append('description', packageData.description);
    if (packageData.category) formData.append('category', packageData.category);
    if (packageData.originalPrice) formData.append('originalPrice', packageData.originalPrice.toString());
    if (packageData.currentPrice) formData.append('currentPrice', packageData.currentPrice.toString());
    if (packageData.deliveryTime) formData.append('deliveryTime', packageData.deliveryTime);
    if (packageData.status !== undefined) formData.append('status', packageData.status.toString());
    
    if (packageData.highlights) {
      formData.append('highlights', JSON.stringify(packageData.highlights));
    }
    
    if (packageData.services) {
      formData.append('services', JSON.stringify(packageData.services));
    }
    
    // Adicionar imagem se fornecida
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.authenticatedFormDataRequest<CreatePackageResponse>(`/packages/${id}`, formData, {
      method: 'PATCH',
    });
  }

  async deletePackage(id: number): Promise<void> {
    const result = await this.authenticatedRequest<void>(`/packages/${id}`, {
      method: 'DELETE',
    });
    return result;
  }
} 