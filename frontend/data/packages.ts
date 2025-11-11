import type { Package } from "@/types/package"
import { apiClient } from "@/lib/api"
import { config } from "@/lib/config"

// Função para converter dados da API para o formato do componente
function convertApiPackageToComponent(apiPackage: any): Package {
  // Construir URL da imagem - se a imagem tem uma URL completa, usar ela, senão construir a URL
  const imageUrl = apiPackage.image 
    ? (apiPackage.image.startsWith('http') 
        ? apiPackage.image 
        : `${config.api.baseUrl}${apiPackage.image}`)
    : "/placeholder.svg?height=400&width=600"

  return {
    id: apiPackage.id,
    name: apiPackage.name,
    description: apiPackage.description,
    price: Number(apiPackage.currentPrice) || 0,
    originalPrice: apiPackage.originalPrice ? Number(apiPackage.originalPrice) : undefined,
    duration: apiPackage.deliveryTime,
    category: apiPackage.category,
    thumbnailUrl: imageUrl,
    image: imageUrl,
    services: apiPackage.services?.map((service: any, index: number) => ({
      id: index + 1,
      name: service.name,
      description: service.description,
      icon: "🎯" // Ícone padrão para todos os serviços
    })) || [],
    highlights: apiPackage.highlights || [],
    isPopular: false, // Pode ser implementado depois se necessário
    color: "#E91E63" // Cor padrão, pode ser personalizada depois
  }
}

// Função para buscar pacotes da API
export async function getPackages(): Promise<Package[]> {
  try {
    const response = await apiClient.getPackages()
    return response.data.map(convertApiPackageToComponent)
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error)
    return []
  }
}

// Dados estáticos como fallback (mantidos para referência)
export const packages: Package[] = [
  {
    id: 1,
    name: "Mini Kit Branding Express",
    description: "Logo simples + paleta de cores + manual básico de uso para começar sua marca de calçados.",
    price: 124.0,
    originalPrice: 149.0,
    duration: "Entrega em 3-5 dias",
    category: "Starter",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#E91E63",
    isPopular: true,
    highlights: ["Economia de R$ 25", "Logo profissional", "Manual de uso incluso", "Paleta de cores personalizada"],
    services: [
      {
        id: 1,
        name: "Logo Simples",
        description: "Design de logotipo profissional para sua marca",
        icon: "🎨",
      },
      {
        id: 2,
        name: "Paleta de Cores",
        description: "Cores personalizadas para sua identidade visual",
        icon: "🌈",
      },
      {
        id: 3,
        name: "Manual Básico",
        description: "Guia de uso da marca e aplicações",
        icon: "📖",
      },
    ],
  },
  {
    id: 2,
    name: "Catálogo Digital Personalizado",
    description: "PDF profissional com seus produtos + logo da sua marca para apresentar aos clientes.",
    price: 149.0,
    duration: "Entrega em 2-3 dias",
    category: "Marketing",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#FF9800",
    highlights: ["Design profissional", "Até 50 produtos", "Logo da sua marca", "Formato PDF otimizado"],
    services: [
      {
        id: 4,
        name: "Design do Catálogo",
        description: "Layout profissional e atrativo",
        icon: "📋",
      },
      {
        id: 5,
        name: "Inserção de Produtos",
        description: "Até 50 produtos com fotos e descrições",
        icon: "👠",
      },
      {
        id: 6,
        name: "Branding Personalizado",
        description: "Sua marca aplicada em todo o material",
        icon: "🏷️",
      },
      {
        id: 7,
        name: "Arquivo Otimizado",
        description: "PDF leve para compartilhar facilmente",
        icon: "📱",
      },
    ],
  },
  {
    id: 3,
    name: "Landing Page Express",
    description: "Landing de 1 página com catálogo, contato WhatsApp e Instagram para vender online.",
    price: 324.0,
    originalPrice: 399.0,
    duration: "Entrega em 5-7 dias",
    category: "Digital",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#4CAF50",
    highlights: ["Economia de R$ 75", "Integração WhatsApp", "Design responsivo", "Catálogo integrado"],
    services: [
      {
        id: 8,
        name: "Página de Vendas",
        description: "Landing page otimizada para conversão",
        icon: "💻",
      },
      {
        id: 9,
        name: "Catálogo Online",
        description: "Seus produtos organizados e apresentáveis",
        icon: "📦",
      },
      {
        id: 10,
        name: "Integração WhatsApp",
        description: "Botões diretos para contato e vendas",
        icon: "📱",
      },
      {
        id: 11,
        name: "Link Instagram",
        description: "Conexão direta com suas redes sociais",
        icon: "📸",
      },
    ],
  },
  {
    id: 4,
    name: "Fotos Profissionais com Marca",
    description: "Fotos em estúdio com o nome/marca da sua empresa para usar no marketing.",
    price: 599.0,
    originalPrice: 799.0,
    duration: "Sessão de 2-3 horas",
    category: "Premium",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#9C27B0",
    highlights: ["Economia de R$ 200", "Estúdio profissional", "Até 50 fotos editadas", "Marca aplicada"],
    services: [
      {
        id: 12,
        name: "Sessão de Fotos",
        description: "Fotografia profissional em estúdio",
        icon: "📷",
      },
      {
        id: 13,
        name: "Edição Profissional",
        description: "Tratamento e edição de todas as fotos",
        icon: "✨",
      },
      {
        id: 14,
        name: "Aplicação da Marca",
        description: "Sua marca aplicada nas imagens",
        icon: "🏷️",
      },
      {
        id: 15,
        name: "Entrega Digital",
        description: "Fotos em alta resolução para uso comercial",
        icon: "💾",
      },
    ],
  },
  {
    id: 5,
    name: "Montagem de Loja Básica",
    description: "Setup básico na Nuvemshop com até 20 produtos + banners + integração WhatsApp.",
    price: 799.0,
    originalPrice: 999.0,
    duration: "Setup em 7-10 dias",
    category: "E-commerce",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#2196F3",
    highlights: ["Economia de R$ 200", "Loja completa", "Integração WhatsApp", "Banners inclusos"],
    services: [
      {
        id: 16,
        name: "Configuração da Loja",
        description: "Setup completo na plataforma Nuvemshop",
        icon: "🏪",
      },
      {
        id: 17,
        name: "Cadastro de Produtos",
        description: "Até 20 produtos com fotos e descrições",
        icon: "📦",
      },
      {
        id: 18,
        name: "Design de Banners",
        description: "Banners promocionais para sua loja",
        icon: "🎨",
      },
      {
        id: 19,
        name: "Integração WhatsApp",
        description: "Botão de contato direto para vendas",
        icon: "💬",
      },
      {
        id: 20,
        name: "Configurações Básicas",
        description: "Formas de pagamento e entrega",
        icon: "⚙️",
      },
    ],
  },
  {
    id: 6,
    name: "Personalização na Palmilha",
    description: "Impressão do seu logotipo direto na palmilha dos calçados (mínimo de 50 pares).",
    price: 3.75,
    originalPrice: 5.0,
    duration: "Por par",
    category: "Customização",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#795548",
    highlights: ["Preço por par", "Mínimo 50 pares", "Logo na palmilha", "Acabamento profissional"],
    services: [
      {
        id: 21,
        name: "Impressão do Logo",
        description: "Seu logotipo impresso na palmilha",
        icon: "👟",
      },
      {
        id: 22,
        name: "Acabamento Premium",
        description: "Impressão de alta qualidade e durabilidade",
        icon: "⭐",
      },
      {
        id: 23,
        name: "Cores Personalizadas",
        description: "Logo nas cores da sua marca",
        icon: "🎨",
      },
    ],
  },
  {
    id: 7,
    name: "Tag de Marca Personalizada",
    description: "Tag em papel ou tecido com a marca da sua empresa para anexar aos produtos.",
    price: 1.5,
    originalPrice: 2.0,
    duration: "Por unidade",
    category: "Branding",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#607D8B",
    highlights: ["Preço por unidade", "Papel ou tecido", "Design personalizado", "Mínimo 100 unidades"],
    services: [
      {
        id: 24,
        name: "Design da Tag",
        description: "Criação do design personalizado",
        icon: "🏷️",
      },
      {
        id: 25,
        name: "Material Premium",
        description: "Papel ou tecido de alta qualidade",
        icon: "📄",
      },
      {
        id: 26,
        name: "Impressão Profissional",
        description: "Cores vivas e acabamento perfeito",
        icon: "🖨️",
      },
    ],
  },
  {
    id: 8,
    name: "Plano de Marketing Mensal",
    description: "Gestão mensal das redes sociais + tráfego pago básico para impulsionar suas vendas.",
    price: 1050.0,
    originalPrice: 1500.0,
    duration: "Mensal",
    category: "Marketing",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    color: "#E91E63",
    highlights: ["Economia de R$ 450", "Gestão completa", "Tráfego pago incluso", "Relatórios mensais"],
    services: [
      {
        id: 27,
        name: "Gestão de Redes Sociais",
        description: "Posts diários no Instagram e Facebook",
        icon: "📱",
      },
      {
        id: 28,
        name: "Tráfego Pago",
        description: "Campanhas no Facebook e Instagram Ads",
        icon: "🎯",
      },
      {
        id: 29,
        name: "Criação de Conteúdo",
        description: "Posts, stories e materiais visuais",
        icon: "🎨",
      },
      {
        id: 30,
        name: "Relatórios Mensais",
        description: "Análise de resultados e métricas",
        icon: "📊",
      },
      {
        id: 31,
        name: "Atendimento Dedicado",
        description: "Suporte direto via WhatsApp",
        icon: "💬",
      },
    ],
  },
]
