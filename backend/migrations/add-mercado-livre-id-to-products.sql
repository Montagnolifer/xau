-- Migration: Adicionar coluna mercado_livre_id na tabela products
-- Data: 2024

-- Adiciona a coluna mercado_livre_id na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS mercado_livre_id VARCHAR(255) NULL;

-- Cria um índice para melhorar a performance de buscas por mercado_livre_id
CREATE INDEX IF NOT EXISTS idx_products_mercado_livre_id ON products(mercado_livre_id);

-- Comentário na coluna
COMMENT ON COLUMN products.mercado_livre_id IS 'ID do produto no Mercado Livre para rastreamento de sincronização';

