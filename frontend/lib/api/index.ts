import { config } from '../config';
import { BaseApiClient } from './base-client';
import { UsersApi } from './users-api';
import { ProductsApi } from './products-api';
import { PackagesApi } from './packages-api';
import { ordersApi } from './orders-api';

// Exportar interfaces e tipos
export * from './base-client';
export * from './users-api';
export * from './products-api';
export * from './packages-api';
export * from './orders-api';

// Criar instâncias das APIs
const baseUrl = config.api.baseUrl;

export const usersApi = new UsersApi(baseUrl);
export const productsApi = new ProductsApi(baseUrl);
export const packagesApi = new PackagesApi(baseUrl);

// Cliente API principal (mantém compatibilidade com código existente)
export class ApiClient extends BaseApiClient {
  constructor() {
    super(baseUrl);
  }

  // Métodos de usuários
  async register(userData: any): Promise<any> {
    return usersApi.register(userData);
  }

  async getUsers(): Promise<any[]> {
    return usersApi.getUsers();
  }

  async loginAdmin(email: string, password: string): Promise<any> {
    return usersApi.loginAdmin(email, password);
  }

  // Métodos de produtos
  async getProducts(): Promise<any[]> {
    return productsApi.getProducts();
  }

  async getProduct(id: number): Promise<any> {
    return productsApi.getProduct(id);
  }

  async createProduct(productData: FormData, images?: File[]): Promise<any> {
    return productsApi.createProduct(productData, images);
  }

  async updateProduct(id: number, productData: FormData, images?: File[]): Promise<any> {
    return productsApi.updateProduct(id, productData, images);
  }

  async deleteProduct(id: number): Promise<any> {
    return productsApi.deleteProduct(id);
  }

  async toggleFavorite(id: number): Promise<any> {
    return productsApi.toggleFavorite(id);
  }

  async getFavorites(): Promise<any[]> {
    return productsApi.getFavorites();
  }

  // Métodos de pacotes
  async createPackage(packageData: any, imageFile?: File): Promise<any> {
    return packagesApi.createPackage(packageData, imageFile);
  }

  async getPackages(): Promise<any> {
    return packagesApi.getPackages();
  }

  async getPackagesAdmin(): Promise<any> {
    return packagesApi.getPackagesAdmin();
  }

  async getPackage(id: number): Promise<any> {
    return packagesApi.getPackage(id);
  }

  async getPackageAdmin(id: number): Promise<any> {
    return packagesApi.getPackageAdmin(id);
  }

  async updatePackage(id: number, packageData: any, imageFile?: File): Promise<any> {
    return packagesApi.updatePackage(id, packageData, imageFile);
  }

  async deletePackage(id: number): Promise<void> {
    return packagesApi.deletePackage(id);
  }

  // Métodos de pedidos
  async createOrder(orderData: any): Promise<any> {
    return ordersApi.createOrder(orderData);
  }

  async getAllOrders(): Promise<any[]> {
    return ordersApi.getAllOrders();
  }

  async getMyOrders(): Promise<any[]> {
    return ordersApi.getMyOrders();
  }

  async getOrderById(id: string): Promise<any> {
    return ordersApi.getOrderById(id);
  }

  async updateOrderStatus(id: string, status: string): Promise<any> {
    return ordersApi.updateOrderStatus(id, status);
  }

  async markWhatsappSent(id: string): Promise<any> {
    return ordersApi.markWhatsappSent(id);
  }

  async deleteOrder(id: string): Promise<void> {
    return ordersApi.deleteOrder(id);
  }

  async getOrderCountByUser(userId: string): Promise<{ count: number }> {
    return ordersApi.getOrderCountByUser(userId);
  }

  async getOrderCountsByUsers(): Promise<{ userId: string; count: number }[]> {
    return ordersApi.getOrderCountsByUsers();
  }
}

// Exportar instância do cliente principal para manter compatibilidade
export const apiClient = new ApiClient(); 