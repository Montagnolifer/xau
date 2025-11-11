-- Script para adicionar a coluna image na tabela packages
-- Execute este script no seu banco de dados PostgreSQL

ALTER TABLE packages ADD COLUMN IF NOT EXISTS image VARCHAR(255);

-- Comentário na coluna para documentação
COMMENT ON COLUMN packages.image IS 'Caminho da imagem do pacote'; 