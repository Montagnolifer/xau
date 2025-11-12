# Frontend - Catálogo Emma

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3101
```

### 2. Instalação de Dependências

```bash
npm install
# ou
pnpm install
```

### 3. Executar o Projeto

```bash
# Desenvolvimento
npm run dev
# ou
pnpm dev

# Produção
npm run build
npm run start
```

## Funcionalidades

### Autenticação

- **Registro**: `/auth/register` - Cadastro de novos usuários
- **Login**: `/auth/login` - Login de usuários existentes

### Integração com Backend

O frontend está configurado para se comunicar com o backend através da API client em `lib/api.ts`.

### Exemplo de Uso da API

```typescript
import { apiClient } from '@/lib/api'

// Cadastrar usuário
const response = await apiClient.register({
  name: "João Silva",
  whatsapp: "5511999999999",
  password: "123456",
  agreeMarketing: true
})
```

## Estrutura do Projeto

```
app/
├── auth/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── globals.css
├── layout.tsx
└── page.tsx

components/
├── ui/
└── ...

lib/
└── api.ts
``` 