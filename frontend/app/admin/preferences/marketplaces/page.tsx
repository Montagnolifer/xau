"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LucideIcon,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react"

type MarketplaceStatus = "connected" | "pending" | "disconnected"

type Marketplace = {
  id: string
  name: string
  description: string
  status: MarketplaceStatus
  lastSync?: string
  category: string
  icon: LucideIcon
  brandColor: string
  productsCount?: number
}

const marketplaces: Marketplace[] = [
  {
    id: "mercado-livre",
    name: "Mercado Livre",
    description: "Venda com a maior vitrine da América Latina e sincronize pedidos em tempo real.",
    status: "connected",
    lastSync: "Sincronizado há 18 minutos",
    category: "Marketplace",
    icon: Store,
    brandColor: "from-yellow-400 to-amber-500",
    productsCount: 126,
  },
  {
    id: "shopee",
    name: "Shopee",
    description: "Centralize pedidos, estoque e catálogo da sua operação na Shopee.",
    status: "pending",
    category: "Marketplace",
    icon: ShoppingBag,
    brandColor: "from-orange-500 to-red-500",
  },
]

const statusConfig: Record<
  MarketplaceStatus,
  { label: string; badgeClasses: string; description: string }
> = {
  connected: {
    label: "Conectado",
    badgeClasses: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "Integração ativa e sincronizando dados",
  },
  pending: {
    label: "Configuração pendente",
    badgeClasses: "bg-amber-100 text-amber-700 border-amber-200",
    description: "Finalize a configuração para começar a vender",
  },
  disconnected: {
    label: "Não conectado",
    badgeClasses: "bg-slate-100 text-slate-600 border-slate-200",
    description: "Conecte-se para habilitar esta integração",
  },
}

export default function MarketplacesPage() {
  const router = useRouter()

  const connectedCount = marketplaces.filter(
    (marketplace) => marketplace.status === "connected",
  ).length

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketplaces</h1>
          <p className="text-slate-500 mt-1">
            Visualize e gerencie todas as integrações disponíveis para conectar suas vendas.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:text-slate-900"
            onClick={() => router.push("/admin/preferences/marketplaces")}
          >
            Central de Ajuda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg shadow-slate-200/60">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Integrações ativas</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{connectedCount}</p>
            <p className="text-sm text-slate-500 mt-1">Sincronizando em tempo real</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/60">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Prontas para conectar</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {marketplaces.filter((m) => m.status !== "connected").length}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Complete a configuração para habilitar vendas
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/60">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Catálogo disponível</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {marketplaces.reduce((total, marketplace) => total + (marketplace.productsCount || 0), 0)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Produtos sincronizados com marketplaces conectados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Integrações disponíveis</h2>
          <p className="text-sm text-slate-500 mt-1">
            Escolha um marketplace para conectar e siga o passo a passo de configuração.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {marketplaces.map((marketplace) => {
            const Icon = marketplace.icon
            const status = statusConfig[marketplace.status]

            return (
              <Card
                key={marketplace.id}
                className="border-0 shadow-lg shadow-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 flex-col gap-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${marketplace.brandColor} text-white shadow-inner`}
                        >
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {marketplace.name}
                            </h3>
                            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                              {marketplace.category}
                            </Badge>
                            <Badge variant="outline" className={status.badgeClasses}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{marketplace.description}</p>
                          {marketplace.lastSync ? (
                            <p className="text-xs font-medium text-emerald-600 mt-2">
                              {marketplace.lastSync}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-2">{status.description}</p>
                          )}
                        </div>
                      </div>

                      {marketplace.productsCount ? (
                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
                          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Produtos ativos
                            </p>
                            <p className="text-base font-semibold text-slate-900 mt-1">
                              {marketplace.productsCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Status da sincronização
                            </p>
                            <p className="text-base font-semibold text-slate-900 mt-1">
                              {marketplace.lastSync ? "Automática" : "Manual"}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() =>
                          router.push(`/admin/preferences/marketplaces/${marketplace.id}`)
                        }
                      >
                        {marketplace.status === "connected" ? "Gerenciar" : "Conectar"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-slate-200 text-slate-500 hover:text-slate-800 sm:w-auto"
                        onClick={() =>
                          router.push(`/admin/preferences/marketplaces/${marketplace.id}/detalhes`)
                        }
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/30 shadow-none transition hover:border-indigo-200 hover:bg-indigo-50/40">
            <CardContent className="flex h-full flex-col items-center justify-center gap-4 text-center p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Solicitar novo marketplace</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Não encontrou a integração que precisa? Envie uma solicitação para nossa equipe.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                onClick={() => router.push("/admin/preferences/marketplaces/solicitar")}
              >
                Entrar em contato
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
