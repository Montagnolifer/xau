# Sistema de Personalizações de Produtos

## Visão Geral

O sistema de personalizações permite criar diferentes tipos de opções de personalização para produtos, como nomes personalizados, cores, tamanhos especiais, uploads de imagens, etc. Cada personalização tem um valor adicional que é somado ao preço base do produto.

## Funcionalidades

### 1. Configuração de Personalizações

Acesse **Admin > Configurações > Personalizações de Produto** para:

- ✅ Criar novas personalizações
- ✅ Definir título, descrição e valor adicional
- ✅ Escolher o tipo de personalização (texto, imagem, cor)
- ✅ Definir onde a personalização aparece (produto individual ou carrinho/pedido)
- ✅ Ativar/desativar personalizações
- ✅ Editar personalizações existentes
- ✅ Excluir personalizações

### 2. Tipos de Personalização

#### Texto
- Permite que o cliente digite um texto personalizado
- Exemplo: "Personalizar Nome" - cliente digita o nome desejado

#### Cor
- Permite escolher entre cores predefinidas
- Exemplo: "Escolher Cor" - cliente seleciona vermelho, azul, verde, etc.

#### Imagem
- Permite upload de imagem personalizada
- Exemplo: "Upload de Logo" - cliente faz upload da logo da empresa

### 3. Local de Aplicação

#### Produto Individual
- A personalização aparece na página do produto
- Cliente personaliza cada produto separadamente
- Exemplo: "Personalizar Nome" no produto

#### Carrinho/Pedido
- A personalização aparece no carrinho ou finalização do pedido
- Cliente personaliza o pedido como um todo
- Exemplo: "Mensagem Especial" para o pedido completo

### 3. Uso em Produtos

Para usar as personalizações em um produto:

1. **Importe o componente:**
```tsx
import { ProductCustomizationSelector } from "@/components/product-customization-selector"
import { Customization, ProductCustomization } from "@/types/customization"
```

2. **Configure o estado:**
```tsx
const [selectedCustomizations, setSelectedCustomizations] = useState<ProductCustomization[]>([])
```

3. **Use o componente:**
```tsx
<ProductCustomizationSelector
  customizations={customizations}
  selectedCustomizations={selectedCustomizations}
  onCustomizationsChange={setSelectedCustomizations}
/>
```

4. **Calcule o preço total:**
```tsx
const totalPrice = productPrice + selectedCustomizations.reduce((total, c) => total + c.price, 0)
```

## Estrutura de Dados

### Customization
```typescript
interface Customization {
  id: string
  title: string
  description: string
  price: number
  isActive: boolean
  type: 'text' | 'image' | 'color'
  scope: 'product' | 'cart' // Onde a personalização aparece
  options?: string[] // Para tipo 'select'
}
```

### ProductCustomization
```typescript
interface ProductCustomization {
  customizationId: string
  value: string
  price: number
}
```

## Exemplo de Implementação

Veja o arquivo `frontend/app/admin/produtos/exemplo-personalizacao/page.tsx` para um exemplo completo de como implementar o sistema de personalizações em uma página de produto.

## Fluxo de Uso

1. **Administrador:**
   - Acessa Configurações > Personalizações de Produto
   - Cria personalizações (ex: "Personalizar Nome" por R$ 5,00)
   - Ativa/desativa conforme necessário

2. **Cliente:**
   - Visualiza o produto
   - Vê as personalizações disponíveis
   - Seleciona as desejadas
   - Preenche os valores solicitados
   - Vê o preço total atualizado automaticamente

## Benefícios

- ✅ **Flexibilidade:** Diferentes tipos de personalização
- ✅ **Controle:** Ativar/desativar conforme necessário
- ✅ **Precificação:** Valor adicional configurável
- ✅ **UX Intuitiva:** Interface clara e fácil de usar
- ✅ **Escalabilidade:** Fácil adição de novos tipos

## Próximos Passos

1. **Integração com Backend:** Salvar personalizações no banco de dados
2. **API Endpoints:** Criar endpoints para gerenciar personalizações
3. **Validação:** Adicionar validações de entrada
4. **Imagens:** Implementar upload e preview de imagens
5. **Histórico:** Manter histórico de personalizações por pedido 