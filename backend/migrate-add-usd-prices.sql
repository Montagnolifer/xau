-- Migração para adicionar campos de preço em dólar na tabela products
-- Este script adiciona os campos priceUSD e wholesalePriceUSD

-- Adicionar coluna priceUSD
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "priceUSD" DECIMAL(10,2) NULL;

-- Adicionar coluna wholesalePriceUSD
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "wholesalePriceUSD" DECIMAL(10,2) NULL;

-- Comentários nas colunas
COMMENT ON COLUMN products."priceUSD" IS 'Preço do produto em dólares americanos (USD)';
COMMENT ON COLUMN products."wholesalePriceUSD" IS 'Preço de atacado do produto em dólares americanos (USD)';

