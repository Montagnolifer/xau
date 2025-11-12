"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LucideIcon,
  Loader2,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react"
import {
  marketplacesApi,
  type MarketplaceAccount,
} from "@/lib/api/marketplaces-api"

type MarketplaceStatus = "connected" | "pending" | "disconnected"

type MarketplaceDefinition = {
  id: string
  provider?: "mercado_livre"
  name: string
  description: string
  category: string
  icon: LucideIcon
  brandColor: string
  defaultStatus: MarketplaceStatus
}

type MarketplaceCardData = MarketplaceDefinition & {
  status: MarketplaceStatus
  lastSync?: string
  productsCount?: number
  accounts: MarketplaceAccount[]
}

const marketplaceDefinitions: MarketplaceDefinition[] = [
  {
    id: "mercado-livre",
    provider: "mercado_livre",
    name: "Mercado Livre",
    description:
      "Venda com a maior vitrine da América Latina e sincronize pedidos em tempo real.",
    category: "Marketplace",
    icon: Store,
    brandColor: "from-yellow-400 to-amber-500",
    defaultStatus: "pending",
  },
  {
    id: "shopee",
    name: "Shopee",
    description:
      "Centralize pedidos, estoque e catálogo da sua operação na Shopee.",
    category: "Marketplace",
    icon: ShoppingBag,
    brandColor: "from-orange-500 to-red-500",
    defaultStatus: "pending",
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

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

function formatDateTime(value?: string | null) {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return dateTimeFormatter.format(parsed)
}

function getNextExpirationLabel(accounts: MarketplaceAccount[]): string {
  const expirations = accounts
    .map((account) =>
      account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null,
    )
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime())

  if (!expirations.length) {
    return "Automática"
  }

  const label = formatDateTime(expirations[0].toISOString())
  return label ? `Até ${label}` : "Automática"
}

export default function MarketplacesPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<MarketplaceAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true)
      setErrorMessage(null)
      const response = await marketplacesApi.listAccounts()
      setAccounts(response)
    } catch (error) {
      console.error("Erro ao carregar contas de marketplace:", error)
      setErrorMessage(
        "Não foi possível carregar as contas conectadas. Tente novamente.",
      )
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleMercadoLivreConnection = useCallback(async () => {
    try {
      setConnectingProvider("mercado_livre")
      setErrorMessage(null)
      const { authorizationUrl } = await marketplacesApi.authorizeMercadoLivre()
      window.location.href = authorizationUrl
    } catch (error) {
      console.error("Erro ao iniciar conexão Mercado Livre:", error)
      setErrorMessage(
        "Não foi possível iniciar a autenticação com o Mercado Livre.",
      )
      setConnectingProvider(null)
    }
  }, [])

  const resolvedMarketplaces = useMemo<MarketplaceCardData[]>(() => {
    return marketplaceDefinitions.map((definition) => {
      const providerAccounts = definition.provider
        ? accounts.filter((account) => account.provider === definition.provider)
        : []

      const status: MarketplaceStatus =
        definition.provider && providerAccounts.length > 0
          ? "connected"
          : definition.defaultStatus

      const lastUpdated =
        providerAccounts.length > 0
          ? formatDateTime(providerAccounts[0]?.updatedAt) ?? undefined
          : undefined

      return {
        ...definition,
        status,
        lastSync: lastUpdated
          ? `Atualizado em ${lastUpdated}`
          : undefined,
        accounts: providerAccounts,
        productsCount:
          definition.provider === "mercado_livre" ? undefined : undefined,
      }
    })
  }, [accounts])

  const connectedCount = useMemo(
    () =>
      resolvedMarketplaces.filter(
        (item) => item.status === "connected",
      ).length,
    [resolvedMarketplaces],
  )

  const readyToConnectCount = useMemo(
    () =>
      resolvedMarketplaces.filter(
        (item) => item.status !== "connected",
      ).length,
    [resolvedMarketplaces],
  )

  const catalogCount = useMemo(
    () =>
      resolvedMarketplaces.reduce(
        (total, marketplace) => total + (marketplace.productsCount || 0),
        0,
      ),
    [resolvedMarketplaces],
  )

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
            disabled={loadingAccounts}
            onClick={fetchAccounts}
          >
            {loadingAccounts ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando...
              </span>
            ) : (
              "Atualizar status"
            )}
          </Button>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:text-slate-900"
            onClick={() => router.push("/admin/preferences/marketplaces")}
          >
            Central de Ajuda
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

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
              {readyToConnectCount}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Complete a configuração para habilitar vendas
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/60">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Catálogo disponível</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{catalogCount}</p>
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
          {resolvedMarketplaces.map((marketplace) => {
            const Icon = marketplace.icon
            const status = statusConfig[marketplace.status]
            const hasAccounts = marketplace.accounts.length > 0
            const isMercadoLivre = marketplace.provider === "mercado_livre"
            const isConnecting = connectingProvider === "mercado_livre"
            const nextExpiration = hasAccounts
              ? getNextExpirationLabel(marketplace.accounts)
              : null

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

                      {hasAccounts ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3 text-sm text-slate-500 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Contas conectadas
                              </p>
                              <p className="text-base font-semibold text-slate-900 mt-1">
                                {marketplace.accounts.length}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Próxima expiração
                              </p>
                              <p className="text-base font-semibold text-slate-900 mt-1">
                                {nextExpiration}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {marketplace.accounts.map((account) => {
                              const accountName =
                                account.accountName?.trim() || `Conta ${account.externalUserId}`
                              const tokenExpiresAt = formatDateTime(account.tokenExpiresAt)

                              return (
                                <div
                                  key={account.id}
                                  className="rounded-lg border border-slate-100 bg-white px-4 py-3"
                                >
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {accountName}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        ID externo: {account.externalUserId}
                                      </p>
                                    </div>
                                    {tokenExpiresAt ? (
                                      <span className="text-xs text-slate-400">
                                        Token expira em {tokenExpiresAt}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <Button
                        className="w-full sm:w-auto"
                        disabled={isMercadoLivre && isConnecting}
                        onClick={() => {
                          if (isMercadoLivre) {
                            void handleMercadoLivreConnection()
                          } else {
                            router.push(`/admin/preferences/marketplaces/${marketplace.id}`)
                          }
                        }}
                      >
                        {isMercadoLivre ? (
                          isConnecting ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Conectando...
                            </span>
                          ) : hasAccounts ? (
                            "Adicionar conta"
                          ) : (
                            "Conectar"
                          )
                        ) : marketplace.status === "connected" ? (
                          "Gerenciar"
                        ) : (
                          "Conectar"
                        )}
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

