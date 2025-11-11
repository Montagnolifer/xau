import { config } from '../config';

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export class BaseApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Se a resposta for 204 No Content, não tentar fazer parse do JSON
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Método para obter token de autenticação
  protected getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin_token');
      const userToken = localStorage.getItem('auth_token');
      
      // Detectar se estamos em uma rota administrativa
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      
      if (isAdminRoute) {
        // Para rotas administrativas, usar token de admin
        return adminToken;
      } else {
        // Para outras rotas, usar token de usuário
        return userToken;
      }
    }
    return null;
  }

  // Método para fazer requisições autenticadas
  protected async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Se a resposta for 204 No Content ou 200 sem conteúdo, retornar undefined
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T;
      }

      // Tentar fazer parse do JSON apenas se houver conteúdo
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        return undefined as T;
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Método para requisições com FormData autenticadas
  protected async authenticatedFormDataRequest<T>(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      body: formData,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
} 