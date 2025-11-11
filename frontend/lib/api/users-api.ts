import { BaseApiClient } from './base-client';

export interface CreateUserRequest {
  name: string;
  whatsapp: string;
  zipCode?: string;
  password: string;
  agreeMarketing?: boolean;
  isWholesale?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  whatsapp?: string;
  password?: string;
  agreeMarketing?: boolean;
  isActive?: boolean;
  isWholesale?: boolean;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  currency?: string;
  language?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  whatsapp: string;
  agreeMarketing: boolean;
  isActive: boolean;
  isWholesale: boolean;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  currency?: string;
  language?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterResponse {
  message: string;
  user: UserResponse;
}

export class UsersApi extends BaseApiClient {
  async register(userData: CreateUserRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUsers(): Promise<UserResponse[]> {
    return this.authenticatedRequest<UserResponse[]>('/users/admin');
  }

  async loginAdmin(email: string, password: string): Promise<{ access_token: string; admin: any }> {
    return this.request<{ access_token: string; admin: any }>(
      '/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  async getUserById(id: string): Promise<UserResponse> {
    return this.authenticatedRequest<UserResponse>(`/users/${id}`);
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<UserResponse> {
    return this.authenticatedRequest<UserResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
} 