"use client"

import React, { useState, useEffect } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "0,00", 
  className,
  ...props 
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("")

  // Função para formatar valor como moeda brasileira
  const formatCurrency = (value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "")
    
    if (!numbers) return ""
    
    // Converte para centavos
    const cents = parseInt(numbers)
    
    // Formata como moeda brasileira
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cents / 100)
    
    return formatted
  }

  // Função para extrair valor numérico da string formatada
  const parseCurrency = (formattedValue: string): string => {
    const numbers = formattedValue.replace(/\D/g, "")
    if (!numbers) return ""
    
    const cents = parseInt(numbers)
    return (cents / 100).toFixed(2)
  }

  // Atualizar display quando value prop muda
  useEffect(() => {
    if (value === "" || value === "0" || value === "0.00") {
      setDisplayValue("")
    } else {
      setDisplayValue(formatCurrency(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Se o campo está vazio, limpar tudo
    if (!inputValue) {
      setDisplayValue("")
      onChange("")
      return
    }
    
    // Formatar o valor
    const formatted = formatCurrency(inputValue)
    setDisplayValue(formatted)
    
    // Extrair valor numérico para o onChange
    const numericValue = parseCurrency(formatted)
    onChange(numericValue)
  }

  const handleBlur = () => {
    // Garantir que sempre tenha o formato correto ao sair do campo
    if (value && value !== "0" && value !== "0.00") {
      setDisplayValue(formatCurrency(value))
    }
  }

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("border-slate-300 focus:border-indigo-500 focus:ring-indigo-500", className)}
    />
  )
}
