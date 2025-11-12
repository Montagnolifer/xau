# Scripts de Upload

Este diretório contém scripts para gerenciar automaticamente a cópia de arquivos de upload entre as pastas de desenvolvimento e produção.

## 🚀 Solução Automática (RECOMENDADA)

Agora as imagens são copiadas **automaticamente** após cada upload! Não é mais necessário executar comandos manualmente.

### Como usar:

1. **Desenvolvimento normal:**
   ```bash
   npm run start:dev
   ```
   As imagens são copiadas automaticamente após cada upload.

2. **Desenvolvimento com monitoramento em tempo real:**
   ```bash
   npm run start:dev:watch
   ```
   Inicia o servidor junto com monitoramento automático de uploads.

## 📁 Scripts Disponíveis

### `copy-uploads.js`
Copia todos os arquivos da pasta `uploads` para `dist/uploads` uma única vez.

**Uso:**
```bash
npm run copy-uploads
```

**Quando usar:**
- Após fazer build do projeto
- Quando precisar sincronizar manualmente os uploads
- Durante o processo de deploy

### `watch-uploads.js`
Monitora mudanças na pasta `uploads` e copia automaticamente novos arquivos para `dist/uploads`.

**Uso:**
```bash
npm run watch-uploads
```

**Quando usar:**
- Durante o desenvolvimento
- Para sincronização automática de uploads em tempo real

### `start-with-watch.js`
Inicia o servidor NestJS junto com o monitoramento de uploads.

**Uso:**
```bash
npm run start:dev:watch
```

## ⚡ Configuração Automática

Os seguintes scripts já estão configurados para executar automaticamente:

- `npm run build` - Executa `copy-uploads` após o build
- `npm run start:dev` - Copia imagens automaticamente após upload
- `npm run start:dev:3105` - Copia imagens automaticamente após upload na porta 3105
- `npm run start:dev:watch` - Inicia servidor com monitoramento automático

## 🔧 Como Funciona

### Cópia Automática
- Quando você faz upload de uma imagem através da API, ela é automaticamente copiada para `dist/uploads`
- Não é necessário executar comandos manuais
- Funciona para produtos

### Monitoramento em Tempo Real
- O script `watch-uploads.js` monitora a pasta `uploads`
- Quando um novo arquivo é detectado, ele é automaticamente copiado
- Ideal para desenvolvimento

## 🛠️ Solução de Problemas

### Imagens não aparecem após upload
1. Verifique se o servidor está rodando
2. As imagens são copiadas automaticamente, mas você pode executar `npm run copy-uploads` para sincronizar manualmente
3. Verifique se a pasta `dist/uploads` existe
4. Verifique se os arquivos foram copiados corretamente

### Durante desenvolvimento
Para ter sincronização automática durante o desenvolvimento, use:
```bash
npm run start:dev:watch
```

### Verificar status
Para verificar se os arquivos estão sincronizados:
```bash
ls -la uploads/
ls -la dist/uploads/
```

## 📂 Estrutura de Pastas

```
backend/
├── uploads/          # Pasta de desenvolvimento (onde as imagens são salvas)
├── dist/
│   └── uploads/      # Pasta de produção (servida pelo NestJS)
└── scripts/
    ├── copy-uploads.js
    ├── watch-uploads.js
    └── start-with-watch.js
```

## 🎯 Por que isso é necessário?

O NestJS serve arquivos estáticos da pasta `dist/uploads`, mas durante o desenvolvimento e build, os arquivos são salvos na pasta `uploads`. 

**ANTES:** Era necessário executar comandos manuais para copiar as imagens.

**AGORA:** As imagens são copiadas automaticamente após cada upload, tornando o desenvolvimento muito mais fluido!

## 🚀 Comandos Rápidos

```bash
# Desenvolvimento normal (cópia automática)
npm run start:dev

# Desenvolvimento com monitoramento
npm run start:dev:watch

# Sincronização manual
npm run copy-uploads

# Monitoramento apenas
npm run watch-uploads
``` 