-- Adicionar coluna wholesale_price na tabela products
ALTER TABLE products 
ADD COLUMN wholesale_price DECIMAL(10,2) NULL;

-- Comentário para documentar a coluna
COMMENT ON COLUMN products.wholesale_price IS 'Preço de atacado do produto (opcional)';
