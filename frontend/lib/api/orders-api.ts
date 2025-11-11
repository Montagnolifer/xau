import { config } from '../config'

// Criar uma instância do cliente base para orders
const baseUrl = config.api.baseUrl

class OrdersApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    
    // Obter token de autenticação
    const token = this.getAuthToken()
    if (!token) {
      throw new Error('Token de autenticação não encontrado')
    }
    
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
        console.error('❌ API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorData: errorData,
          requestData: options.body
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const responseText = await response.text();
      console.log('📥 Response text:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        console.log('⚠️ Empty response, returning undefined');
        return undefined as T;
      }

      const jsonResponse = JSON.parse(responseText);
      console.log('📥 Parsed response:', jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin_token');
      const userToken = localStorage.getItem('auth_token');
      
      // Detectar se estamos em uma rota administrativa
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      
      if (isAdminRoute) {
        // Para rotas administrativas, usar token de admin
        return adminToken;
      } else {
        // Para outras rotas (como criação de pedidos), usar token de usuário
        return userToken;
      }
    }
    return null;
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    console.log('📤 POST request:', endpoint, data);
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    console.log('📤 PATCH request:', endpoint, data);
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiClient = new OrdersApiClient()

export interface OrderProduct {
  productId: string
  name: string
  reference?: string
  sku?: string
  price: number
  quantity: number
  selectedSize?: string
  selectedColor?: string
  imageUrl?: string
}

export interface AdditionalCost {
  id: string
  name: string
  description?: string
  amount: number
  type: 'personalization' | 'shipping' | 'box' | 'other'
}

export interface OrderUser {
  id: string
  name: string
  whatsapp: string
  isWholesale: boolean
}

export interface CreateOrderRequest {
  userId: string
  products: OrderProduct[]
  totalAmount: number
  totalItems: number
  notes?: string
}

export interface UpdateOrderRequest {
  products?: OrderProduct[]
  additionalCosts?: AdditionalCost[]
  totalAmount?: number
  totalItems?: number
  notes?: string
  status?: string
  whatsappSent?: boolean
  userName?: string
  userId?: string
}

export interface OrderResponse {
  id: string
  user: OrderUser
  products: OrderProduct[]
  additionalCosts?: AdditionalCost[]
  totalAmount: number
  totalItems: number
  status: string
  notes?: string
  whatsappSent: boolean
  createdAt: string
  updatedAt: string
}

export const ordersApi = {
  // Criar novo pedido
  createOrder: async (orderData: CreateOrderRequest): Promise<OrderResponse> => {
    return await apiClient.post<OrderResponse>('/orders', orderData)
  },

  // Buscar todos os pedidos (admin)
  getAllOrders: async (): Promise<OrderResponse[]> => {
    return await apiClient.get<OrderResponse[]>('/orders')
  },

  // Buscar pedidos do usuário logado
  getMyOrders: async (): Promise<OrderResponse[]> => {
    return await apiClient.get<OrderResponse[]>('/orders/my-orders')
  },

  // Buscar pedido por ID
  getOrderById: async (id: string): Promise<OrderResponse> => {
    return await apiClient.get<OrderResponse>(`/orders/${id}`)
  },

  // Atualizar status do pedido
  updateOrderStatus: async (id: string, status: string): Promise<OrderResponse> => {
    return await apiClient.patch<OrderResponse>(`/orders/${id}/status`, { status })
  },

  // Marcar WhatsApp como enviado
  markWhatsappSent: async (id: string): Promise<OrderResponse> => {
    return await apiClient.patch<OrderResponse>(`/orders/${id}/whatsapp-sent`)
  },

  // Atualizar pedido completo
  updateOrder: async (id: string, updateData: UpdateOrderRequest): Promise<OrderResponse> => {
    return await apiClient.patch<OrderResponse>(`/orders/${id}`, updateData)
  },

  // Deletar pedido
  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`)
  },

  // Buscar contagem de pedidos por usuário
  getOrderCountByUser: async (userId: string): Promise<{ count: number }> => {
    return await apiClient.get<{ count: number }>(`/orders/count/${userId}`)
  },

  // Buscar contagem de pedidos para todos os usuários
  getOrderCountsByUsers: async (): Promise<{ userId: string; count: number }[]> => {
    return await apiClient.get<{ userId: string; count: number }[]>('/orders/counts/by-users')
  }
}
