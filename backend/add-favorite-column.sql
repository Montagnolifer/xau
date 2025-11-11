-- Adicionar coluna isFavorite na tabela products
ALTER TABLE products ADD COLUMN isFavorite BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance de consultas por favoritos
CREATE INDEX idx_products_is_favorite ON products(isFavorite); 