-- Create table for product variant items (combinations)
CREATE TABLE IF NOT EXISTS product_variant_items (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  options JSONB NOT NULL,
  sku VARCHAR(255) NULL,
  price NUMERIC(10,2) NOT NULL,
  wholesale_price NUMERIC(10,2) NULL,
  price_usd NUMERIC(10,2) NULL,
  wholesale_price_usd NUMERIC(10,2) NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variant_items_options ON product_variant_items USING GIN (options);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variant_items_product_options ON product_variant_items (product_id, options);


