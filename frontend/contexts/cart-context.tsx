"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react"
import type { Product, ProductImage } from "@/types/product"
import { useAuth } from "./auth-context"
import {
  cartApi,
  type CartResponse,
  type CartItemResponse,
  type CartItemPayload,
} from "@/lib/api/cart-api"

export interface CartItem {
  id: string
  product: Product
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface CartState {
  id?: string
  items: CartItem[]
  totalItems: number
  totalAmount: number
  minimumOrder: number
  userType: "wholesale" | "retail"
}

interface RefreshCartOptions {
  showLoading?: boolean
}

interface CartContextValue {
  state: CartState
  isLoading: boolean
  isSyncing: boolean
  addItem: (item: CartItemInput) => Promise<void>
  removeItem: (productId: string, size?: string, color?: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: (options?: RefreshCartOptions) => Promise<void>
  getItemsRemaining: () => number
  isMinimumOrderMet: () => boolean
  isRetailPromotionMet: () => boolean
}

export interface CartItemInput {
  product: Product
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

const CartContext = createContext<CartContextValue | null>(null)

const getInitialState = (userType: "wholesale" | "retail" = "retail"): CartState => ({
  id: undefined,
  items: [],
  totalItems: 0,
  totalAmount: 0,
  minimumOrder: userType === "wholesale" ? 8 : 2,
  userType,
})

const extractPrimaryImageUrl = (images?: Product["images"]): string | undefined => {
  if (!images || images.length === 0) {
    return undefined
  }

  if (typeof images[0] === "string") {
    return images[0] as string
  }

  const typedImages = images as ProductImage[]
  const mainImage = typedImages.find(image => image.isMain)
  return mainImage?.url ?? typedImages[0]?.url
}

const mapCartItemResponseToItem = (item: CartItemResponse): CartItem => {
  const snapshot = item.metadata?.productSnapshot ?? item.metadata?.product ?? {}
  const imagesFromMetadata = snapshot.images ?? item.metadata?.images
  const fallbackImage = item.imageUrl ? [item.imageUrl] : []
  const quantity = Number(item.quantity ?? 0)

  const product: Product = {
    id: Number(item.productId) || snapshot.id || 0,
    name: snapshot.name ?? item.name,
    description: snapshot.description ?? "",
    price: snapshot.price ?? Number(item.price),
    wholesalePrice: snapshot.wholesalePrice ?? item.metadata?.wholesalePrice,
    reference: snapshot.reference ?? item.reference,
    sku: snapshot.sku ?? item.sku,
    category: snapshot.category,
    categoryId: snapshot.categoryId,
    images: imagesFromMetadata ?? fallbackImage,
    sizes: snapshot.sizes,
    colors: snapshot.colors,
    stock: snapshot.stock,
    status: snapshot.status,
    weight: snapshot.weight,
    dimensions: snapshot.dimensions,
    youtubeUrl: snapshot.youtubeUrl,
    variations: snapshot.variations,
    isFavorite: snapshot.isFavorite,
  }

  return {
    id: item.id,
    product,
    quantity: Number.isFinite(quantity) ? quantity : 0,
    selectedSize: item.selectedSize ?? undefined,
    selectedColor: item.selectedColor ?? undefined,
  }
}

const mapCartResponseToState = (
  response: CartResponse,
  userType: "wholesale" | "retail",
): CartState => {
  const items = response.items?.map(mapCartItemResponseToItem) ?? []
  const calculatedTotalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

  return {
    id: response.id,
    items,
    totalItems: calculatedTotalItems,
    totalAmount: Number(response.totalAmount ?? 0),
    minimumOrder: userType === "wholesale" ? 8 : 2,
    userType,
  }
}

const buildCartItemPayload = (
  input: CartItemInput,
  userType: "wholesale" | "retail",
): CartItemPayload => {
  const effectivePrice =
    userType === "wholesale" && input.product.wholesalePrice
      ? input.product.wholesalePrice
      : input.product.price

  return {
    productId: input.product.id.toString(),
    name: input.product.name,
    reference: input.product.reference,
    sku: input.product.sku,
    price: effectivePrice,
    quantity: input.quantity,
    selectedSize: input.selectedSize,
    selectedColor: input.selectedColor,
    imageUrl: extractPrimaryImageUrl(input.product.images),
    metadata: {
      productSnapshot: input.product,
      basePrice: input.product.price,
      wholesalePrice: input.product.wholesalePrice,
      images: input.product.images,
      category: input.product.category,
      categoryId: input.product.categoryId,
      sizes: input.product.sizes,
      colors: input.product.colors,
    },
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [state, setState] = useState<CartState>(() => getInitialState())
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const userType = useMemo<"wholesale" | "retail">(
    () => (user?.isWholesale ? "wholesale" : "retail"),
    [user?.isWholesale],
  )

  const applyCartResponse = useCallback(
    (response: CartResponse | null) => {
      if (!response) {
        setState(getInitialState(userType))
        return
      }
      setState(mapCartResponseToState(response, userType))
    },
    [userType],
  )

  const refreshCart = useCallback(
    async (options?: RefreshCartOptions) => {
      const showLoading = options?.showLoading ?? true
      if (!isAuthenticated || !user) {
        setState(getInitialState("retail"))
        return
      }

      if (showLoading) {
        setIsLoading(true)
      }

      try {
        const response = await cartApi.getMyCart()
        applyCartResponse(response)
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error)
        setState(getInitialState(userType))
      } finally {
        if (showLoading) {
          setIsLoading(false)
        }
      }
    },
    [applyCartResponse, isAuthenticated, user, userType],
  )

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(getInitialState("retail"))
      return
    }

    void refreshCart({ showLoading: true })
  }, [isAuthenticated, user, refreshCart])

  const addItem = useCallback(
    async (input: CartItemInput) => {
      if (!isAuthenticated || !user) {
        console.warn("Usuário não autenticado. Redirecionando para login.")
        window.location.href = "/auth/login"
        return
      }

      setIsSyncing(true)
      try {
        const payload = buildCartItemPayload(input, userType)
        const response = await cartApi.addOrUpdateItem(payload)
        applyCartResponse(response)
        await refreshCart({ showLoading: false })
      } catch (error) {
        console.error("Erro ao adicionar item ao carrinho:", error)
      } finally {
        setIsSyncing(false)
      }
    },
    [applyCartResponse, isAuthenticated, refreshCart, user, userType],
  )

  const findCartItemId = useCallback(
    (productId: string, size?: string, color?: string): string | undefined => {
      return state.items.find(item => {
        const sameProduct = item.product.id.toString() === productId.toString()
        const sameSize = (item.selectedSize ?? null) === (size ?? null)
        const sameColor = (item.selectedColor ?? null) === (color ?? null)
        return sameProduct && sameSize && sameColor
      })?.id
    },
    [state.items],
  )

  const removeItem = useCallback(
    async (productId: string, size?: string, color?: string) => {
      if (!isAuthenticated || !user) {
        return
      }

      const itemId = findCartItemId(productId, size, color)
      if (!itemId) {
        console.warn("Item do carrinho não encontrado para remoção.")
        return
      }

      setIsSyncing(true)
      try {
        const response = await cartApi.removeItem(itemId)
        applyCartResponse(response)
        await refreshCart({ showLoading: false })
      } catch (error) {
        console.error("Erro ao remover item do carrinho:", error)
      } finally {
        setIsSyncing(false)
      }
    },
    [applyCartResponse, findCartItemId, isAuthenticated, refreshCart, user, userType],
  )

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, size?: string, color?: string) => {
      if (!isAuthenticated || !user) {
        return
      }

      if (quantity <= 0) {
        await removeItem(productId, size, color)
        return
      }

      const itemId = findCartItemId(productId, size, color)
      if (!itemId) {
        console.warn("Item do carrinho não encontrado para atualização.")
        return
      }

      setIsSyncing(true)
      try {
        const response = await cartApi.updateItem(itemId, { quantity })
        applyCartResponse(response)
        await refreshCart({ showLoading: false })
      } catch (error) {
        console.error("Erro ao atualizar quantidade do item:", error)
      } finally {
        setIsSyncing(false)
      }
    },
    [applyCartResponse, findCartItemId, isAuthenticated, refreshCart, removeItem, user, userType],
  )

  const clearCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return
    }

    setIsSyncing(true)
    try {
      const response = await cartApi.clearCart()
      applyCartResponse(response)
      await refreshCart({ showLoading: false })
    } catch (error) {
      console.error("Erro ao limpar carrinho:", error)
      setState(getInitialState(userType))
    } finally {
      setIsSyncing(false)
    }
  }, [applyCartResponse, isAuthenticated, refreshCart, user, userType])

  const getItemsRemaining = useCallback(() => {
    if (state.userType === "retail") {
      return Math.max(0, 2 - state.totalItems)
    }
    return Math.max(0, state.minimumOrder - state.totalItems)
  }, [state.minimumOrder, state.totalItems, state.userType])

  const isMinimumOrderMet = useCallback(() => {
    if (state.userType === "retail") {
      return state.totalItems >= 1
    }
    return state.totalItems >= state.minimumOrder
  }, [state.minimumOrder, state.totalItems, state.userType])

  const isRetailPromotionMet = useCallback(() => {
    return state.userType === "retail" && state.totalItems >= 2
  }, [state.totalItems, state.userType])

  const value: CartContextValue = {
    state,
    isLoading,
    isSyncing,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart,
    getItemsRemaining,
    isMinimumOrderMet,
    isRetailPromotionMet,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}