-- MyEzz Restaurant Orders Table Schema
-- Run this in your Supabase SQL Editor

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN (
            'new',
            'preparing',
            'ready',
            'completed',
            'cancelled'
        )
    ),
    verification_code TEXT,
    prep_time INTEGER,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders (order_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO orders (order_id, customer_name, items, total, status, verification_code, created_at)
VALUES 
  ('ORD001', 'Yug Patel', '[{"name": "Margherita Pizza", "quantity": 1}, {"name": "Caesar Salad", "quantity": 1}]'::jsonb, 249.99, 'new', 'A1B2', NOW()),
  ('ORD002', 'Aksh Maheshwari', '[{"name": "Chicken Burger", "quantity": 2}, {"name": "French Fries", "quantity": 1}]'::jsonb, 185.00, 'preparing', 'C3D4', NOW()),
  ('ORD003', 'Nayan Chellani', '[{"name": "French Fries", "quantity": 1}]'::jsonb, 157.50, 'ready', 'E5F6', NOW())
ON CONFLICT (order_id) DO NOTHING;

-- Verify the table was created successfully
SELECT COUNT(*) as total_orders, SUM(total) as total_revenue
FROM orders;