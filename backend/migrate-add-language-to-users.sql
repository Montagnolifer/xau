-- Migração para adicionar campo de idioma na tabela users
-- Este script adiciona o campo language com valor padrão 'pt' (Português)

-- Adicionar coluna language
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'pt' NOT NULL;

-- Atualizar registros existentes para ter 'pt' como padrão (caso não tenham)
UPDATE users 
SET language = 'pt' 
WHERE language IS NULL OR language = '';

-- Comentário na coluna
COMMENT ON COLUMN users.language IS 'Idioma preferido do usuário (pt para Português, es para Espanhol). Padrão: pt';


