"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LucideIcon,
  Loader2,
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
  provider?: MarketplaceAccount["provider"]
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
    provider: "shopee",
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
  const searchParams = useSearchParams()
  const processedParamsRef = useRef(false)
  const [accounts, setAccounts] = useState<MarketplaceAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const mlStatus = searchParams.get("ml_status")

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

  useEffect(() => {
    if (processedParamsRef.current) {
      return
    }

    if (mlStatus === "success") {
      processedParamsRef.current = true
      setSuccessMessage(
        "Integração com o Mercado Livre concluída com sucesso! A partir de agora você pode acompanhar tudo por aqui.",
      )
      setConnectingProvider(null)
      router.replace("/admin/preferences/marketplaces", { scroll: false })
    }
  }, [mlStatus, router])

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

  const marketplaceDefinitionByProvider = useMemo<
    Record<string, MarketplaceDefinition>
  >(() => {
    return marketplaceDefinitions.reduce<Record<string, MarketplaceDefinition>>(
      (accumulator, definition) => {
        if (definition.provider) {
          accumulator[definition.provider] = definition
        }
        return accumulator
      },
      {},
    )
  }, [])

  const connectedMarketplaces = useMemo<MarketplaceCardData[]>(() => {
    const groupedByProvider = accounts.reduce<
      Record<string, MarketplaceAccount[]>
    >((accumulator, account) => {
      if (!accumulator[account.provider]) {
        accumulator[account.provider] = []
      }
      accumulator[account.provider].push(account)
      return accumulator
    }, {})

    return Object.entries(groupedByProvider)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([provider, providerAccounts]) => {
        const definition = marketplaceDefinitionByProvider[provider]

        const lastUpdatedTimestamp = providerAccounts
          .map((account) => new Date(account.updatedAt).getTime())
          .filter((value) => !Number.isNaN(value))
          .sort((a, b) => b - a)[0]

        const lastUpdatedLabel = lastUpdatedTimestamp
          ? formatDateTime(new Date(lastUpdatedTimestamp).toISOString())
          : undefined

        const baseDefinition: MarketplaceDefinition =
          definition ??
          ({
            id: provider,
            provider,
            name: provider,
            description: "Integração conectada",
            category: "Marketplace",
            icon: Store,
            brandColor: "from-slate-400 to-slate-500",
            defaultStatus: "connected",
          } satisfies MarketplaceDefinition)

        return {
          ...baseDefinition,
          provider,
          status: "connected",
          lastSync: lastUpdatedLabel
            ? `Atualizado em ${lastUpdatedLabel}`
            : undefined,
          accounts: providerAccounts,
          productsCount: undefined,
        }
      })
  }, [accounts, marketplaceDefinitionByProvider])

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

  const mercadoLivreMarketplace = useMemo(
    () =>
      resolvedMarketplaces.find(
        (marketplace) => marketplace.id === "mercado-livre",
      ),
    [resolvedMarketplaces],
  )

  const shopeeMarketplace = useMemo(
    () =>
      resolvedMarketplaces.find((marketplace) => marketplace.id === "shopee"),
    [resolvedMarketplaces],
  )

  const MercadoLivreIcon = mercadoLivreMarketplace?.icon
  const ShopeeIcon = shopeeMarketplace?.icon

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketplaces</h1>
          <p className="text-slate-500 mt-1">
            Visualize e gerencie todas as integrações disponíveis para conectar suas vendas.
          </p>
        </div>

      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <p className="text-sm font-semibold text-emerald-800">
            Tudo pronto por aqui! ✨
          </p>
          <p className="mt-1 text-emerald-700">{successMessage}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mercadoLivreMarketplace && MercadoLivreIcon ? (
          <Card className="border border-slate-200 bg-white/80 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${mercadoLivreMarketplace.brandColor} text-white`}
                >
                  <MercadoLivreIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Mercado Livre
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      statusConfig[mercadoLivreMarketplace.status].badgeClasses
                    }
                  >
                    {statusConfig[mercadoLivreMarketplace.status].label}
                  </Badge>
                </div>
              </div>

              {mercadoLivreMarketplace.accounts.length ? (
                <p className="text-sm text-slate-600">
                  {mercadoLivreMarketplace.accounts.length} conta
                  {mercadoLivreMarketplace.accounts.length > 1 ? "s" : ""} já
                  conectada
                  {mercadoLivreMarketplace.accounts.length > 1 ? "s" : ""}.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Conecte sua conta Mercado Livre para sincronizar pedidos em
                  tempo real.
                </p>
              )}

              <Button
                disabled={connectingProvider === "mercado_livre"}
                onClick={() => {
                  if (mercadoLivreMarketplace.provider === "mercado_livre") {
                    void handleMercadoLivreConnection()
                  } else {
                    router.push(
                      `/admin/preferences/marketplaces/${mercadoLivreMarketplace.id}`,
                    )
                  }
                }}
              >
                {connectingProvider === "mercado_livre" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando...
                  </span>
                ) : mercadoLivreMarketplace.accounts.length ? (
                  "Adicionar conta ML"
                ) : (
                  "Conectar agora"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {shopeeMarketplace && ShopeeIcon ? (
          <Card className="border border-slate-200 bg-white/80 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${shopeeMarketplace.brandColor} text-white`}
                >
                  <ShopeeIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Shopee</p>
                  <Badge
                    variant="outline"
                    className={
                      statusConfig[shopeeMarketplace.status].badgeClasses
                    }
                  >
                    {statusConfig[shopeeMarketplace.status].label}
                  </Badge>
                </div>
              </div>

              {shopeeMarketplace.accounts.length ? (
                <p className="text-sm text-slate-600">
                  {shopeeMarketplace.accounts.length} conta
                  {shopeeMarketplace.accounts.length > 1 ? "s" : ""} já
                  conectada
                  {shopeeMarketplace.accounts.length > 1 ? "s" : ""}.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Conecte sua operação Shopee e centralize estoque e catálogo.
                </p>
              )}

              <Button
                onClick={() =>
                  router.push(
                    `/admin/preferences/marketplaces/${shopeeMarketplace.id}`,
                  )
                }
              >
                {shopeeMarketplace.accounts.length
                  ? "Adicionar conta Shopee"
                  : "Conectar agora"}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>


      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Suas integrações
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Todas as suas integrações conectadas estão listadas abaixo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {connectedMarketplaces.map((marketplace) => {
            const Icon = marketplace.icon
            const status = statusConfig[marketplace.status]
            const hasAccounts = marketplace.accounts.length > 0
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
                        disabled={loadingAccounts}
                        onClick={() => {
                          void fetchAccounts()
                        }}
                      >
                        {loadingAccounts ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Atualizando...
                          </span>
                        ) : (
                          "Atualizar"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

        </div>
      </div>
    </div>
  )
}

