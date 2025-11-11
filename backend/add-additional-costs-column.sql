-- Adicionar coluna para custos adicionais na tabela de pedidos
-- Execute este script se você já tem pedidos cadastrados no sistema

ALTER TABLE orders 
ADD COLUMN additional_costs JSON;

-- Atualizar registros existentes para ter um array vazio como padrão
UPDATE orders 
SET additional_costs = '[]' 
WHERE additional_costs IS NULL;
