-- Migração da tabela orders para usar foreign key em vez de JSON
-- Este script atualiza a estrutura da tabela orders

-- 1. Primeiro, vamos fazer backup dos dados existentes (se houver)
-- CREATE TABLE orders_backup AS SELECT * FROM orders;

-- 2. Remover a tabela orders existente
DROP TABLE IF EXISTS orders CASCADE;

-- 3. Criar a nova tabela orders com foreign key
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    products JSONB NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "totalItems" INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    "whatsappSent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar a foreign key constraint
ALTER TABLE orders 
ADD CONSTRAINT FK_orders_user 
FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders ("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders ("createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_sent ON orders ("whatsappSent");

-- 6. Comentários na tabela
COMMENT ON TABLE orders IS 'Tabela para armazenar pedidos do sistema';
COMMENT ON COLUMN orders."userId" IS 'ID do usuário que fez o pedido (FK para users)';
COMMENT ON COLUMN orders.products IS 'Lista de produtos do pedido (JSON)';
COMMENT ON COLUMN orders."totalAmount" IS 'Valor total do pedido';
COMMENT ON COLUMN orders."totalItems" IS 'Quantidade total de itens';
COMMENT ON COLUMN orders.status IS 'Status do pedido (pending, confirmed, shipped, delivered, cancelled)';
COMMENT ON COLUMN orders.notes IS 'Observações adicionais do pedido';
COMMENT ON COLUMN orders."whatsappSent" IS 'Indica se a mensagem do WhatsApp foi enviada';
