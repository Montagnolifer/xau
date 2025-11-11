"use client"

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from "react"
import type { Product } from "@/types/product"
import { useAuth } from "./auth-context"

export interface CartItem {
  product: Product
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface CartState {
  items: CartItem[]
  totalItems: number
  minimumOrder: number
  userType: 'wholesale' | 'retail'
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string; size?: string; color?: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number; size?: string; color?: string } }
  | { type: "CLEAR_CART" }
  | { type: "SET_MINIMUM_ORDER"; payload: number }
  | { type: "SET_USER_TYPE"; payload: 'wholesale' | 'retail' }

const CartContext = createContext<{
  state: CartState
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size?: string, color?: string) => void
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void
  clearCart: () => void
  getItemsRemaining: () => number
  isMinimumOrderMet: () => boolean
  isRetailPromotionMet: () => boolean
} | null>(null)

// Chave para o localStorage
const CART_STORAGE_KEY = 'emma-santoni-cart'

// Função para carregar dados do localStorage
const loadCartFromStorage = (): CartState => {
  if (typeof window === 'undefined') {
    return {
      items: [],
      totalItems: 0,
      minimumOrder: 8,
      userType: 'retail'
    }
  }

  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      return {
        items: parsedCart.items || [],
        totalItems: parsedCart.totalItems || 0,
        minimumOrder: parsedCart.minimumOrder || 8,
        userType: parsedCart.userType || 'retail'
      }
    }
  } catch (error) {
    console.error('Erro ao carregar carrinho do localStorage:', error)
  }

  return {
    items: [],
    totalItems: 0,
    minimumOrder: 8,
    userType: 'retail'
  }
}

// Função para salvar dados no localStorage
const saveCartToStorage = (state: CartState) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Erro ao salvar carrinho no localStorage:', error)
  }
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        item => 
          item.product.id.toString() === action.payload.product.id.toString() &&
          item.selectedSize === action.payload.selectedSize &&
          item.selectedColor === action.payload.selectedColor
      )

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items]
        updatedItems[existingItemIndex].quantity += action.payload.quantity
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + action.payload.quantity
        }
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
          totalItems: state.totalItems + action.payload.quantity
        }
      }
    }

    case "REMOVE_ITEM": {
      const filteredItems = state.items.filter(item => {
        if (action.payload.size && action.payload.color) {
          return !(item.product.id.toString() === action.payload.productId && 
                   item.selectedSize === action.payload.size && 
                   item.selectedColor === action.payload.color)
        } else if (action.payload.size) {
          return !(item.product.id.toString() === action.payload.productId && 
                   item.selectedSize === action.payload.size)
        } else if (action.payload.color) {
          return !(item.product.id.toString() === action.payload.productId && 
                   item.selectedColor === action.payload.color)
        } else {
          return item.product.id.toString() !== action.payload.productId
        }
      })

      const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0)
      return {
        ...state,
        items: filteredItems,
        totalItems
      }
    }

    case "UPDATE_QUANTITY": {
      const updatedItems = state.items.map(item => {
        if (action.payload.size && action.payload.color) {
          if (item.product.id.toString() === action.payload.productId && 
              item.selectedSize === action.payload.size && 
              item.selectedColor === action.payload.color) {
            return { ...item, quantity: action.payload.quantity }
          }
        } else if (action.payload.size) {
          if (item.product.id.toString() === action.payload.productId && 
              item.selectedSize === action.payload.size) {
            return { ...item, quantity: action.payload.quantity }
          }
        } else if (action.payload.color) {
          if (item.product.id.toString() === action.payload.productId && 
              item.selectedColor === action.payload.color) {
            return { ...item, quantity: action.payload.quantity }
          }
        } else {
          if (item.product.id.toString() === action.payload.productId) {
            return { ...item, quantity: action.payload.quantity }
          }
        }
        return item
      })

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      return {
        ...state,
        items: updatedItems,
        totalItems
      }
    }

    case "CLEAR_CART":
      return {
        ...state,
        items: [],
        totalItems: 0
      }

    case "SET_MINIMUM_ORDER":
      return {
        ...state,
        minimumOrder: action.payload
      }

    case "SET_USER_TYPE":
      return {
        ...state,
        userType: action.payload,
        minimumOrder: action.payload === 'wholesale' ? 8 : 2
      }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    minimumOrder: 8,
    userType: 'retail'
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // Carregar dados do localStorage após a hidratação
  useEffect(() => {
    const savedCart = loadCartFromStorage()
    if (savedCart.items.length > 0 || savedCart.totalItems > 0) {
      // Restaurar o estado completo
      dispatch({ type: "CLEAR_CART" })
      savedCart.items.forEach(item => {
        dispatch({ type: "ADD_ITEM", payload: item })
      })
    }
    setIsInitialized(true)
  }, [])

  // Atualizar tipo de usuário quando o usuário mudar
  useEffect(() => {
    if (user) {
      const userType = user.isWholesale ? 'wholesale' : 'retail'
      dispatch({ type: "SET_USER_TYPE", payload: userType })
    }
  }, [user])

  const addItem = (item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item })
  }

  const removeItem = (productId: string, size?: string, color?: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId, size, color } })
  }

  const updateQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeItem(productId, size, color)
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity, size, color } })
    }
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const getItemsRemaining = () => {
    // Para usuários de varejo, calcular quantos itens faltam para a promoção (2 pares)
    if (state.userType === 'retail') {
      return Math.max(0, 2 - state.totalItems)
    }
    // Para usuários de atacado, manter a lógica original
    return Math.max(0, state.minimumOrder - state.totalItems)
  }

  const isMinimumOrderMet = () => {
    // Para usuários de varejo, permitir finalização com qualquer quantidade (mínimo 1)
    if (state.userType === 'retail') {
      return state.totalItems >= 1
    }
    // Para usuários de atacado, manter a lógica original
    return state.totalItems >= state.minimumOrder
  }

  const isRetailPromotionMet = () => {
    return state.userType === 'retail' && state.totalItems >= 2
  }

  // Salvar no localStorage sempre que o estado mudar (apenas após inicialização)
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(state)
    }
  }, [state, isInitialized])

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemsRemaining,
      isMinimumOrderMet,
      isRetailPromotionMet
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
} 