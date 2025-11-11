# Estrutura Modular da API

Esta pasta contém a nova estrutura modular da API, organizada por domínio para melhor manutenibilidade e escalabilidade.

## Estrutura

```
api/
├── base-client.ts      # Cliente base com métodos comuns
├── users-api.ts        # API de usuários e autenticação
├── products-api.ts     # API de produtos
├── packages-api.ts     # API de pacotes
├── index.ts           # Arquivo principal que exporta tudo
└── README.md          # Esta documentação
```

## Como usar

### Importação tradicional (mantém compatibilidade)
```typescript
import { apiClient } from '@/lib/api';

// Usar como antes
const packages = await apiClient.getPackages();
```

### Importação modular (recomendado)
```typescript
import { packagesApi, productsApi, usersApi } from '@/lib/api';

// Usar APIs específicas
const packages = await packagesApi.getPackages();
const products = await productsApi.getProducts();
const users = await usersApi.getUsers();
```

### Importação de tipos
```typescript
import { 
  CreatePackageRequest, 
  PackageResponse, 
  CreateUserRequest 
} from '@/lib/api';
```

## Vantagens da nova estrutura

1. **Separação de responsabilidades**: Cada API tem seu próprio arquivo
2. **Melhor manutenibilidade**: Mais fácil encontrar e modificar código específico
3. **Escalabilidade**: Fácil adicionar novas APIs sem afetar as existentes
4. **Compatibilidade**: Código existente continua funcionando
5. **Tipagem melhorada**: Interfaces organizadas por domínio

## Adicionando novas APIs

Para adicionar uma nova API (ex: `orders-api.ts`):

1. Criar o arquivo `orders-api.ts`
2. Estender `BaseApiClient`
3. Implementar os métodos necessários
4. Adicionar ao `index.ts`
5. Exportar tipos e interfaces

Exemplo:
```typescript
// orders-api.ts
import { BaseApiClient } from './base-client';

export interface Order {
  id: number;
  // ... outros campos
}

export class OrdersApi extends BaseApiClient {
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }
  
  async createOrder(orderData: any): Promise<Order> {
    return this.authenticatedRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
}
```

## Migração

O código existente não precisa ser alterado, pois mantivemos a compatibilidade através do `apiClient` principal. Gradualmente, você pode migrar para usar as APIs específicas:

```typescript
// Antes
const packages = await apiClient.getPackages();

// Depois (recomendado)
const packages = await packagesApi.getPackages();
``` 