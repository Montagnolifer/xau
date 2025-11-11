"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { 
  Loader2,
  AlertCircle as AlertCircleIcon
} from "lucide-react"
import { ordersApi, type OrderResponse } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PrintOrderPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pdfGeneratedRef = useRef(false)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const orderData = await ordersApi.getOrderById(orderId)
      setOrder(orderData)
      
      // Aguardar um pouco para garantir que a página carregou antes de gerar PDF
      setTimeout(async () => {
        if (!pdfGeneratedRef.current) {
          pdfGeneratedRef.current = true
          await generatePDF(orderData)
        }
      }, 1000)
    } catch (err) {
      console.error('Erro ao carregar pedido:', err)
      setError('Erro ao carregar pedido. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDF = async (orderData: OrderResponse) => {
    try {
      // Importar html2pdf dinamicamente
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = document.getElementById('print-content')
      if (!element) return

      // Formatar nome do cliente para arquivo (remover caracteres especiais)
      console.log('Order data:', orderData)
      console.log('User name:', orderData?.user?.name)
      
      const clientName = orderData?.user?.name
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífen
        .substring(0, 30) || 'cliente' // Limita a 30 caracteres
      
      console.log('Formatted client name:', clientName)
      
      // Formatar data no formato dd-MM-yy
      const orderDate = orderData?.createdAt 
        ? format(new Date(orderData.createdAt), "dd-MM-yy", { locale: ptBR })
        : format(new Date(), "dd-MM-yy", { locale: ptBR })

      const opt = {
        margin: 0.5,
        filename: `${clientName}-${orderDate}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' as const
        }
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
      // Fallback para impressão se PDF falhar
      window.print()
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Concluído"
      case "processing": return "Processando"
      case "pending": return "Pendente"
      case "cancelled": return "Cancelado"
      default: return "Desconhecido"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-slate-600">Carregando pedido para impressão...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Pedido não encontrado'}</p>
            <p className="text-gray-500">Recarregue a página para tentar novamente</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&display=swap" rel="stylesheet" />

      {/* Conteúdo para impressão */}
      <div id="print-content" className="p-8">
        {/* Faixa dourada no topo */}
        <div className="w-full h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 mb-6"></div>

        {/* Cabeçalho com logo e informações da empresa */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            {/* Logo da empresa */}
            <div className="flex-1">
              <div className="mb-2">
                <img 
                  src="/logo/logo.png" 
                  alt="Emma Santoni" 
                  className="h-20 w-auto object-contain"
                />
              </div>
            </div>

            {/* Informações da empresa */}
            <div className="flex-1 text-right">
              <div className="text-lg font-bold text-gray-800 mb-2">Emma Santoni</div>
              <div className="text-sm text-gray-600 mb-1">Av. João Cernach, 2331</div>
              <div className="text-sm text-gray-600 mb-1">Centro, Birigui-SP</div>
              <div className="text-sm text-gray-600 mb-1">Telefone: (18) 92004-4699</div>
              <div className="text-sm text-gray-600">CNPJ: 58.292.744/0001-07</div>
            </div>
          </div>

          {/* Título do documento */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Comfortaa, sans-serif' }}>ORÇAMENTO</h1>
          </div>

          {/* Informações do cliente e data */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1">
              <div className="text-sm"><span className="font-bold">Cliente:</span> {order.user.name}</div>
              <div className="text-sm"><span className="font-bold">WhatsApp:</span> {order.user.whatsapp}</div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-sm"><span className="font-bold">Data:</span> {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}</div>
            </div>
          </div>
        </div>

        {/* Produtos */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-3 text-left font-bold">Produtos/Sem caixa com Personalização</th>
                <th className="border border-gray-400 p-3 text-center font-bold">Qtd.</th>
                <th className="border border-gray-400 p-3 text-center font-bold">Valor Un.</th>
                <th className="border border-gray-400 p-3 text-center font-bold">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product, index) => (
                <tr key={index}>
                  <td className="border border-gray-400 p-3">
                    <div className="flex items-center gap-3">
                      {/* Imagem do Produto */}
                      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-300 overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name || 'Produto'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-gray-400 text-xs ${product.imageUrl ? 'hidden' : ''}`}>
                          IMG
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium">
                          {product.name && product.name.length > 30 
                            ? `${product.name.substring(0, 30)}...` 
                            : product.name}
                          {product.sku && (
                            <span className="text-sm text-gray-600">
                              • SKU: {product.sku}
                            </span>
                          )}
                        </div>
                        {(product.selectedSize || product.selectedColor) && (
                          <div className="text-sm text-gray-600 mt-1">
                            {product.selectedSize && `Tamanho: ${product.selectedSize}`}
                            {product.selectedSize && product.selectedColor && " • "}
                            {product.selectedColor && `Cor: ${product.selectedColor}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-400 p-3 text-center">{product.quantity}</td>
                  <td className="border border-gray-400 p-3 text-center">{formatPrice(product.price)}</td>
                  <td className="border border-gray-400 p-3 text-center font-semibold">
                    {formatPrice(product.price * product.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custos Adicionais */}
        {order.additionalCosts && order.additionalCosts.length > 0 && (
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                {order.additionalCosts.map((cost, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-3">
                      <div className="font-medium">
                        {cost.type === 'other' && cost.name ? cost.name : 
                         cost.type === 'personalization' ? 'Personalizações Palmilha' :
                         cost.type === 'shipping' ? 'Frete - Correios Sedex / 2 dias úteis' :
                         cost.type === 'box' ? 'Caixa Personalizada' : 'Outro'}
                      </div>
                      {cost.description && (
                        <div className="text-sm text-gray-600 mt-1">{cost.description}</div>
                      )}
                    </td>
                    <td className="border border-gray-400 p-3 text-center">-</td>
                    <td className="border border-gray-400 p-3 text-center">-</td>
                    <td className="border border-gray-400 p-3 text-center font-semibold">
                      {formatPrice(cost.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Resumo Final */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-400">
            <tbody>
              <tr className="border-t-2 border-gray-600">
                <td className="border border-gray-400 p-3 font-bold" colSpan={3} style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                  TOTAL COM FRETE
                </td>
                <td className="border border-gray-400 p-3 text-center font-bold text-lg" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                  {formatPrice(order.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div className="text-center text-sm text-gray-500 border-t border-gray-300 pt-4 mt-8">
          <p>Orçamento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </div>

      {/* Estilos específicos para impressão */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&display=swap');
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: 'Comfortaa', sans-serif;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .p-8 {
            padding: 20px !important;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          .border {
            border-color: #000 !important;
          }
          
          .border-gray-400 {
            border-color: #000 !important;
          }
          
          .text-gray-800 {
            color: #000 !important;
          }
          
          .text-gray-600 {
            color: #333 !important;
          }
          
          .text-gray-500 {
            color: #666 !important;
          }
          
          .bg-gray-100 {
            background-color: #f5f5f5 !important;
          }
          
          .text-yellow-600 {
            color: #d97706 !important;
          }
          
          .bg-yellow-400, .bg-yellow-600 {
            background-color: #fbbf24 !important;
          }
          
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          
          * {
            font-family: 'Comfortaa', sans-serif !important;
          }
        }
      `}</style>
    </div>
  )
}
