-- ============================================================================
-- MyEzz Unified Orders Schema
-- Production-ready schema for interconnecting User App ↔ Restaurant ↔ Rider
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- UNIFIED ORDERS TABLE
-- Central table for all orders across the platform
-- ============================================================================

CREATE TABLE IF NOT EXISTS unified_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order identification
    order_id TEXT UNIQUE NOT NULL,
    
    -- Customer information
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- Delivery information
    delivery_address TEXT NOT NULL,
    delivery_location JSONB, -- {type: "Point", coordinates: [lng, lat]}
    
    -- Restaurant information
    restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE SET NULL,
    restaurant_name TEXT NOT NULL,
    
    -- Order items
    items JSONB NOT NULL, -- [{name, quantity, price, isVeg, notes}]
    
    -- Pricing breakdown
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 30.00,
    platform_fee DECIMAL(10, 2) DEFAULT 8.00,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Payment information
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'online')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id TEXT, -- Razorpay payment ID
    
    -- Order status workflow
    status TEXT NOT NULL DEFAULT 'pending_restaurant' CHECK (
        status IN (
            'pending_restaurant',   -- Waiting for restaurant to accept
            'preparing',            -- Restaurant accepted, preparing food
            'ready_for_pickup',     -- Food ready, waiting for rider
            'rider_assigned',       -- Rider has been assigned
            'picked_up',            -- Rider picked up the order
            'out_for_delivery',     -- Rider is delivering
            'delivered',            -- Order delivered successfully
            'rejected',             -- Restaurant rejected
            'cancelled'             -- Customer/system cancelled
        )
    ),
    
    -- Verification
    verification_code TEXT NOT NULL, -- 4-char code for rider verification
    
    -- Restaurant handling
    prep_time INTEGER, -- Estimated prep time in minutes
    rejection_reason TEXT,
    
    -- Rider integration
    rider_order_id TEXT, -- MongoDB ObjectId from rider system
    assigned_rider_id TEXT,
    
    -- Refund handling
    refund_status TEXT CHECK (refund_status IN ('initiated', 'processing', 'completed', 'failed')),
    refund_amount DECIMAL(10, 2),
    refund_reason TEXT,
    
    -- Notes
    customer_notes TEXT,
    restaurant_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unified_orders_order_id ON unified_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_unified_orders_customer_id ON unified_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_unified_orders_restaurant_id ON unified_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_unified_orders_status ON unified_orders(status);
CREATE INDEX IF NOT EXISTS idx_unified_orders_created_at ON unified_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_orders_payment_status ON unified_orders(payment_status);

-- Composite index for restaurant dashboard queries
CREATE INDEX IF NOT EXISTS idx_unified_orders_restaurant_status 
ON unified_orders(restaurant_id, status, created_at DESC);

-- ============================================================================
-- AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_unified_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_unified_orders_updated_at ON unified_orders;
CREATE TRIGGER trigger_unified_orders_updated_at
    BEFORE UPDATE ON unified_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_unified_orders_updated_at();

-- ============================================================================
-- ORDER STATUS HISTORY TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES unified_orders(order_id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT, -- 'system', 'restaurant', 'rider', 'customer'
    change_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
ON order_status_history(order_id, created_at DESC);

-- ============================================================================
-- TRIGGER TO LOG STATUS CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
        VALUES (NEW.order_id, OLD.status, NEW.status, 'system');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_order_status ON unified_orders;
CREATE TRIGGER trigger_log_order_status
    AFTER UPDATE ON unified_orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE unified_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurants can only see their own orders
CREATE POLICY "Restaurants can view their orders"
ON unified_orders FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND restaurant_id IN (
        SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
);

-- Policy: Customers can only see their own orders
CREATE POLICY "Customers can view their orders"
ON unified_orders FOR SELECT
USING (auth.uid() = customer_id);

-- Policy: Service role can do everything (for backend)
CREATE POLICY "Service role full access"
ON unified_orders FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: Active orders for restaurant dashboard
CREATE OR REPLACE VIEW restaurant_active_orders AS
SELECT 
    o.*,
    EXTRACT(EPOCH FROM (NOW() - o.created_at))/60 as minutes_since_order,
    CASE 
        WHEN o.status = 'pending_restaurant' THEN 'action_required'
        WHEN o.status = 'preparing' AND o.prep_time IS NOT NULL 
             AND EXTRACT(EPOCH FROM (NOW() - o.accepted_at))/60 > o.prep_time THEN 'overdue'
        ELSE 'on_track'
    END as urgency
FROM unified_orders o
WHERE o.status NOT IN ('delivered', 'rejected', 'cancelled')
ORDER BY 
    CASE o.status 
        WHEN 'pending_restaurant' THEN 1
        WHEN 'preparing' THEN 2
        WHEN 'ready_for_pickup' THEN 3
        ELSE 4
    END,
    o.created_at ASC;

-- View: Today's restaurant metrics
CREATE OR REPLACE VIEW restaurant_daily_metrics AS
SELECT 
    restaurant_id,
    restaurant_name,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_orders,
    COUNT(*) FILTER (WHERE status NOT IN ('delivered', 'rejected', 'cancelled')) as active_orders,
    SUM(total) FILTER (WHERE status = 'delivered') as revenue,
    AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))/60) FILTER (WHERE accepted_at IS NOT NULL) as avg_acceptance_time_mins,
    AVG(prep_time) FILTER (WHERE prep_time IS NOT NULL) as avg_prep_time_mins
FROM unified_orders
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY restaurant_id, restaurant_name;

-- ============================================================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================================================

-- Uncomment to insert test data:
/*
INSERT INTO unified_orders (
    order_id, customer_name, customer_phone, delivery_address,
    restaurant_id, restaurant_name, items, subtotal, total,
    payment_method, status, verification_code
) VALUES 
(
    'MYE-TEST001',
    'Test Customer',
    '9876543210',
    '123 Test Street, Test City',
    1,
    'Test Restaurant',
    '[{"name": "Test Item", "quantity": 2, "price": 150}]'::jsonb,
    300.00,
    338.00,
    'cash_on_delivery',
    'pending_restaurant',
    'AB12'
);
*/

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON unified_orders TO authenticated;
GRANT SELECT ON restaurant_active_orders TO authenticated;
GRANT SELECT ON restaurant_daily_metrics TO authenticated;
GRANT SELECT ON order_status_history TO authenticated;

-- Grant full access to service role (backend)
GRANT ALL ON unified_orders TO service_role;
GRANT ALL ON order_status_history TO service_role;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify the schema was created successfully:
SELECT 
    'unified_orders' as table_name,
    COUNT(*) as row_count
FROM unified_orders
UNION ALL
SELECT 
    'order_status_history',
    COUNT(*)
FROM order_status_history;
