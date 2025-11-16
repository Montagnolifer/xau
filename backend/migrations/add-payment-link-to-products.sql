-- Migration: Adicionar coluna payment_link na tabela products

ALTER TABLE products
ADD COLUMN IF NOT EXISTS payment_link VARCHAR(255) NULL;


