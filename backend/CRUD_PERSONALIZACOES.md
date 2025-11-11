# CRUD de Personalizações de Produto

Este documento descreve a implementação completa do CRUD (Create, Read, Update, Delete) para personalizações de produto no sistema.

## Estrutura do Banco de Dados

As personalizações são armazenadas como um campo JSON na tabela `companies`:

```sql
customizations JSON
```

Cada personalização possui a seguinte estrutura:

```typescript
{
  id: string
  title: string
  description: string
  price: number
  isActive: boolean
  type: "text" | "color" | "image" | "select"
  scope: "product" | "cart"
}
```

## Endpoints da API

### 1. Buscar Configurações da Empresa
```http
GET /company/settings
```

### 2. Buscar Empresa por ID
```http
GET /company/{id}
```

### 3. Adicionar Personalização
```http
POST /company/{companyId}/customizations
Content-Type: application/json

{
  "title": "Personalizar Nome",
  "description": "Adicione o nome personalizado ao produto",
  "price": 5.00,
  "type": "text",
  "scope": "product",
  "isActive": true
}
```

### 4. Atualizar Personalização
```http
PATCH /company/{companyId}/customizations/{customizationId}
Content-Type: application/json

{
  "title": "Personalizar Nome Atualizado",
  "price": 7.50
}
```

### 5. Excluir Personalização
```http
DELETE /company/{companyId}/customizations/{customizationId}
```

### 6. Alternar Status da Personalização
```http
PATCH /company/{companyId}/customizations/{customizationId}/toggle
```

### 7. Atualizar Todas as Personalizações
```http
PATCH /company/{companyId}/customizations
Content-Type: application/json

[
  {
    "id": "1",
    "title": "Personalizar Nome",
    "description": "Adicione o nome personalizado ao produto",
    "price": 5.00,
    "isActive": true,
    "type": "text",
    "scope": "product"
  }
]
```

## Implementação no Backend

### Service (company.service.ts)

```typescript
// Adicionar personalização
async addCustomization(id: string, customization: any): Promise<CompanyResponseDto>

// Atualizar personalização
async updateCustomization(id: string, customizationId: string, customizationData: any): Promise<CompanyResponseDto>

// Excluir personalização
async deleteCustomization(id: string, customizationId: string): Promise<CompanyResponseDto>

// Alternar status
async toggleCustomizationStatus(id: string, customizationId: string): Promise<CompanyResponseDto>
```

### Controller (company.controller.ts)

Todos os endpoints RESTful foram implementados com validação e tratamento de erros.

## Implementação no Frontend

### API Client (company-api.ts)

```typescript
// Métodos específicos para CRUD de personalizações
async addCustomization(companyId: string, customization: Omit<CompanySettings['customizations'][0], 'id'>): Promise<CompanySettings>

async updateCustomization(companyId: string, customizationId: string, customizationData: Partial<CompanySettings['customizations'][0]>): Promise<CompanySettings>

async deleteCustomization(companyId: string, customizationId: string): Promise<CompanySettings>

async toggleCustomizationStatus(companyId: string, customizationId: string): Promise<CompanySettings>
```

### Hook (company-settings-hook.ts)

O hook `useCompanySettings` foi atualizado para incluir métodos específicos para CRUD de personalizações:

```typescript
const {
  addCustomization,
  updateCustomization,
  deleteCustomization,
  toggleCustomizationStatus
} = useCompanySettings()
```

### Componente (product-customization-settings.tsx)

O componente foi atualizado para usar os métodos do hook, garantindo sincronização automática com o backend.

## Testes

Para testar a implementação, execute:

```bash
cd backend
node test-customizations.js
```

Este script testa todas as operações CRUD:
1. Buscar configurações da empresa
2. Adicionar nova personalização
3. Atualizar personalização
4. Alternar status
5. Listar personalizações
6. Excluir personalização
7. Verificar exclusão

## Tipos de Personalização

- **text**: Campo de texto para entrada personalizada
- **color**: Seletor de cor
- **image**: Upload de imagem
- **select**: Lista de opções pré-definidas

## Escopo de Aplicação

- **product**: Personalização aplicada a produtos individuais
- **cart**: Personalização aplicada ao carrinho/pedido inteiro

## Características

✅ **CRUD Completo**: Create, Read, Update, Delete  
✅ **Validação**: Validação de dados no backend  
✅ **Tratamento de Erros**: Mensagens de erro apropriadas  
✅ **Sincronização**: Frontend sincronizado com backend  
✅ **Tipagem**: TypeScript em todo o código  
✅ **Testes**: Script de teste automatizado  

## Próximos Passos

1. Implementar opções para personalizações do tipo "select"
2. Adicionar validações mais específicas
3. Implementar logs de auditoria
4. Adicionar testes unitários
5. Implementar cache para melhor performance

