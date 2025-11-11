# Módulo de Pacotes

Este módulo gerencia os pacotes de serviços oferecidos pela plataforma.

## Funcionalidades

- CRUD completo de pacotes
- Upload de imagens para pacotes
- Categorização de pacotes
- Gestão de serviços inclusos
- Destaques e benefícios
- Controle de status (ativo/inativo)

## Estrutura da Entidade

```typescript
interface Package {
  id: number
  name: string
  description: string
  category: string
  originalPrice: number
  currentPrice: number
  deliveryTime: string
  image?: string // Caminho da imagem do pacote
  status: boolean
  highlights: string[]
  services: Array<{ name: string; description: string }>
  createdAt: Date
  updatedAt: Date
}
```

## Upload de Imagens

O módulo suporta upload de imagens para os pacotes através do endpoint `/packages` (POST) e `/packages/:id` (PATCH).

### Características do Upload:

- **Formato**: PNG, JPG, JPEG
- **Tamanho máximo**: 5MB
- **Campo**: `image` (FormData)
- **Armazenamento**: Pasta `./uploads/`
- **URL**: `/uploads/filename.ext`

### Exemplo de Uso:

```javascript
const formData = new FormData()
formData.append('name', 'Nome do Pacote')
formData.append('description', 'Descrição do pacote')
formData.append('image', imageFile) // Arquivo de imagem
// ... outros campos

await fetch('/packages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

## Endpoints

### Públicos
- `GET /packages` - Lista pacotes ativos
- `GET /packages/:id` - Busca pacote por ID
- `GET /packages/category/:category` - Busca por categoria

### Administrativos (requer autenticação)
- `GET /packages/admin` - Lista todos os pacotes
- `GET /packages/admin/:id` - Busca pacote por ID (admin)
- `POST /packages` - Cria novo pacote
- `PATCH /packages/:id` - Atualiza pacote
- `DELETE /packages/:id` - Remove pacote

## Migração do Banco

Para adicionar a coluna `image` na tabela `packages`, execute:

```sql
ALTER TABLE packages ADD COLUMN IF NOT EXISTS image VARCHAR(255);
COMMENT ON COLUMN packages.image IS 'Caminho da imagem do pacote';
```

## Validações

- Nome obrigatório
- Descrição obrigatória
- Categoria obrigatória
- Preços devem ser números positivos
- Tempo de entrega obrigatório
- Pelo menos um serviço válido
- Pelo menos um destaque válido
- Imagem deve ser um arquivo de imagem válido

## Estrutura

```
package/
├── entities/
│   └── package.entity.ts      # Entidade do banco de dados
├── dto/
│   ├── create-package.dto.ts  # DTO para criação
│   ├── update-package.dto.ts  # DTO para atualização
│   └── package-response.dto.ts # DTO de resposta
├── package.service.ts         # Lógica de negócio
├── package.controller.ts      # Controlador REST
├── package.module.ts          # Módulo NestJS
└── index.ts                   # Exportações
```

## Campos do Pacote

- `name`: Nome do pacote
- `description`: Descrição detalhada
- `category`: Categoria do pacote
- `originalPrice`: Preço original
- `currentPrice`: Preço atual
- `deliveryTime`: Tempo de entrega
- `status`: Status ativo/inativo
- `highlights`: Array de destaques
- `services`: Array de serviços inclusos

## Exemplo de Uso

```typescript
// Criar um pacote
const newPackage = {
  name: "Mini Kit Branding Express",
  description: "Pacote completo de branding para pequenas empresas",
  category: "Branding",
  originalPrice: 500.00,
  currentPrice: 350.00,
  deliveryTime: "3-5 dias",
  status: true,
  highlights: ["Economia de R$ 150", "Entrega rápida"],
  services: [
    {
      name: "Logo Simples",
      description: "Design de logotipo profissional"
    }
  ]
}
``` 