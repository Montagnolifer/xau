-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user JSONB NOT NULL,
    products JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    total_items INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    whatsapp_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders USING GIN ((user->>'id'));
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_sent ON orders (whatsapp_sent);

-- Comentários na tabela
COMMENT ON TABLE orders IS 'Tabela para armazenar pedidos do sistema';
COMMENT ON COLUMN orders.user IS 'Dados do usuário que fez o pedido (JSON)';
COMMENT ON COLUMN orders.products IS 'Lista de produtos do pedido (JSON)';
COMMENT ON COLUMN orders.total_amount IS 'Valor total do pedido';
COMMENT ON COLUMN orders.total_items IS 'Quantidade total de itens';
COMMENT ON COLUMN orders.status IS 'Status do pedido (pending, confirmed, shipped, delivered, cancelled)';
COMMENT ON COLUMN orders.notes IS 'Observações adicionais do pedido';
COMMENT ON COLUMN orders.whatsapp_sent IS 'Indica se a mensagem do WhatsApp foi enviada';
