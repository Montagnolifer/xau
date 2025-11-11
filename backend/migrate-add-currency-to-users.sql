-- Migração para adicionar campo de moeda na tabela users
-- Este script adiciona o campo currency com valor padrão 'BRL'

-- Adicionar coluna currency
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL' NOT NULL;

-- Atualizar registros existentes para ter BRL como padrão (caso não tenham)
UPDATE users 
SET currency = 'BRL' 
WHERE currency IS NULL OR currency = '';

-- Comentário na coluna
COMMENT ON COLUMN users.currency IS 'Moeda preferida do usuário (BRL ou USD). Padrão: BRL';

