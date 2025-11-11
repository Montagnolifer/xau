# Sistema de Pedidos

Este módulo implementa o sistema completo de pedidos para o catálogo Emma Santoni.

## Funcionalidades

- ✅ Criação de pedidos com produtos e dados do usuário
- ✅ Armazenamento em JSON para flexibilidade
- ✅ Controle de status dos pedidos
- ✅ Integração com WhatsApp
- ✅ CRUD completo de pedidos
- ✅ Autenticação obrigatória

## Estrutura da Tabela

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user JSONB NOT NULL,           -- Dados do usuário
    products JSONB NOT NULL,       -- Lista de produtos
    total_amount DECIMAL(10,2),    -- Valor total
    total_items INTEGER,           -- Quantidade total
    status VARCHAR(50),            -- Status do pedido
    notes TEXT,                    -- Observações
    whatsapp_sent BOOLEAN,         -- WhatsApp enviado
    created_at TIMESTAMP,          -- Data criação
    updated_at TIMESTAMP           -- Data atualização
);
```

## Endpoints da API

### POST /orders
Criar novo pedido
```json
{
  "user": {
    "id": "uuid",
    "name": "Nome",
    "email": "email@example.com"
  },
  "products": [
    {
      "productId": "123",
      "name": "Produto",
      "price": 50.00,
      "quantity": 2,
      "selectedSize": "38",
      "selectedColor": "Preto"
    }
  ],
  "totalAmount": 100.00,
  "totalItems": 2,
  "notes": "Observações"
}
```

### GET /orders
Listar todos os pedidos (admin)

### GET /orders/my-orders
Listar pedidos do usuário logado

### GET /orders/:id
Buscar pedido por ID

### PATCH /orders/:id/status
Atualizar status do pedido

### PATCH /orders/:id/whatsapp-sent
Marcar WhatsApp como enviado

### DELETE /orders/:id
Deletar pedido

## Status dos Pedidos

- `pending` - Pendente (padrão)
- `confirmed` - Confirmado
- `shipped` - Enviado
- `delivered` - Entregue
- `cancelled` - Cancelado

## Integração Frontend

O frontend integra automaticamente:
1. Cria o pedido no banco
2. Marca WhatsApp como enviado
3. Redireciona para WhatsApp com ID do pedido
4. Limpa o carrinho

## Configuração

Para usar o sistema:

1. Execute o SQL de criação da tabela:
```bash
psql -d sua_database -f create-orders-table.sql
```

2. O módulo já está integrado ao AppModule

3. Use a API client no frontend:
```typescript
import { ordersApi } from '@/lib/api'

// Criar pedido
const order = await ordersApi.createOrder(orderData)
```
