# Cloudflare R2 Integration

Este módulo integra o sistema de uploads com o Cloudflare R2 Storage.

## Configuração das Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=seu_account_id_aqui
CLOUDFLARE_R2_ACCESS_KEY_ID=sua_access_key_aqui
CLOUDFLARE_R2_SECRET_ACCESS_KEY=sua_secret_key_aqui
CLOUDFLARE_R2_BUCKET_NAME=llioraflow
CLOUDFLARE_R2_PUBLIC_DOMAIN=seu_dominio_publico.r2.dev
```

## Como obter as credenciais:

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá para "R2 Object Storage"
3. Crie um novo bucket ou use um existente
4. Vá para "Manage R2 API tokens"
5. Crie um novo token com permissões de leitura e escrita
6. Configure um domínio público para o bucket (opcional, mas recomendado)

## Estrutura de Pastas no R2:

- `image/` - Imagens gerais
- `funnel/image/` - Imagens de funnels
- `funnel/video/` - Vídeos de funnels
- `logo/` - Logos

## Funcionalidades:

- ✅ Upload de arquivos para R2
- ✅ Exclusão de arquivos do R2
- ✅ Geração de URLs públicas
- ✅ URLs assinadas (para arquivos privados)
- ✅ Verificação de existência de arquivos
- ✅ Compressão de imagens antes do upload
- ✅ Configuração automática de CORS

## Configuração de CORS

Para evitar erros de CORS ao acessar imagens do R2 no frontend, execute o comando:

```bash
npm run configure:r2-cors
```

Para verificar se o CORS está configurado corretamente:

```bash
npm run check:r2-cors
```

Este comando configura o bucket do R2 para permitir acesso dos domínios:
- http://localhost:3000
- http://localhost:4000
- https://llio.me
- https://www.llio.me
- https://app.llio.me
- https://www.app.llio.me 