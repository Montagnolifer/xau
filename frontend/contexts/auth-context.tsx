"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  whatsapp: string
  isActive: boolean
  isWholesale: boolean
  lastLoginAt?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  neighborhood?: string
  number?: string
  complement?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Verificar se há token no localStorage ao inicializar
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = (newToken: string, userData: User) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    router.push('/auth/login')
  }

  const checkAuth = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('auth_token')
    
    if (!storedToken) {
      return false
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3105'}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.valid) {
          setUser(data.user)
          setToken(storedToken)
          return true
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
    }

    // Se chegou aqui, o token é inválido
    logout()
    return false
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
} 