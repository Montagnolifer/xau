# Sistema de Admin

Este módulo fornece autenticação para administradores do sistema.

## Endpoints

### POST /admin/login
Faz login do administrador.

**Body:**
```json
{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_aqui",
  "admin": {
    "id": "uuid",
    "name": "Administrador",
    "email": "admin@admin.com",
    "isActive": true
  }
}
```

### GET /admin/profile
Retorna o perfil do administrador logado (requer autenticação).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Como cadastrar um admin no banco

1. **Gere o hash da senha:**
   ```bash
   npx ts-node scripts/generate-admin-password.ts admin123
   ```

2. **Execute o INSERT no banco:**
   ```sql
   INSERT INTO admins (id, name, email, password, "isActive", "createdAt", "updatedAt") VALUES (
     gen_random_uuid(),
     'Nome do Admin',
     'admin@email.com',
     'hash_gerado_pelo_script',
     true,
     NOW(),
     NOW()
   );
   ```

## Estrutura da tabela

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

## Autenticação

O sistema usa JWT tokens com expiração de 24 horas. Para proteger rotas, use o guard:

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected-route')
async protectedRoute() {
  // Rota protegida
}
``` 