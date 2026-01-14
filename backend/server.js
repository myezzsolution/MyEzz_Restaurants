import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Check if Supabase credentials are available
const hasSupabaseCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
let supabase = null;
let useMockData = !hasSupabaseCredentials;

// Initialize Supabase only if credentials are available
if (hasSupabaseCredentials) {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

        // Test connection
        const { error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
        if (error) {
            console.warn('⚠️  Supabase connection failed, falling back to mock data');
            useMockData = true;
        } else {
            console.log('✅ Successfully connected to Supabase');
            useMockData = false;
        }
    } catch (error) {
        console.warn('⚠️  Failed to initialize Supabase, using mock data:', error.message);
        useMockData = true;
    }
}

// Mock in-memory database (used when Supabase is not available)
let mockOrders = [
    {
        id: '1',
        order_id: 'ORD001',
        customer_name: 'Yug Patel',
        items: [
            { name: 'Margherita Pizza', quantity: 1 },
            { name: 'Caesar Salad', quantity: 1 }
        ],
        total: 249.99,
        status: 'new',
        verification_code: 'A1B2',
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        order_id: 'ORD002',
        customer_name: 'Aksh Maheshwari',
        items: [
            { name: 'Chicken Burger', quantity: 2 },
            { name: 'French Fries', quantity: 1 }
        ],
        total: 185.00,
        status: 'preparing',
        verification_code: 'C3D4',
        prep_time: 25,
        accepted_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
    },
    {
        id: '3',
        order_id: 'ORD003',
        customer_name: 'Nayan Chellani',
        items: [
            { name: 'Pasta Carbonara', quantity: 1 }
        ],
        total: 157.50,
        status: 'ready',
        verification_code: 'E5F6',
        created_at: new Date().toISOString()
    }
];

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'MyEzz Restaurant API is running',
        mode: useMockData ? 'MOCK - No Supabase required' : 'PRODUCTION - Connected to Supabase'
    });
});

// Get today's metrics (GMV, Total Orders, Average Order Value)
app.get('/api/metrics/today', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        let orders;

        if (useMockData) {
            // Use mock data
            orders = mockOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= startOfDay && orderDate < endOfDay;
            });
        } else {
            // Use Supabase
            const { data, error } = await supabase
                .from('orders')
                .select('total, status')
                .gte('created_at', startOfDay.toISOString())
                .lt('created_at', endOfDay.toISOString());

            if (error) throw error;
            orders = data;
        }

        // Calculate metrics
        const totalOrders = orders.length;
        const gmv = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const averageOrderValue = totalOrders > 0 ? gmv / totalOrders : 0;

        console.log(`📊 Metrics: GMV=₹${gmv.toFixed(2)}, Orders=${totalOrders}, AOV=₹${averageOrderValue.toFixed(2)}`);

        res.json({
            success: true,
            data: {
                gmv: parseFloat(gmv.toFixed(2)),
                totalOrders,
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                date: startOfDay.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metrics',
            message: error.message
        });
    }
});

// Create a new order (for testing purposes)
app.post('/api/orders', async (req, res) => {
    try {
        const { order_id, customer_name, items, total, status, verification_code } = req.body;

        let newOrder;

        if (useMockData) {
            // Use mock data
            newOrder = {
                id: String(mockOrders.length + 1),
                order_id,
                customer_name,
                items,
                total: parseFloat(total),
                status,
                verification_code,
                created_at: new Date().toISOString()
            };
            mockOrders.push(newOrder);
        } else {
            // Use Supabase
            const { data, error } = await supabase
                .from('orders')
                .insert([
                    {
                        order_id,
                        customer_name,
                        items,
                        total,
                        status,
                        verification_code,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;
            newOrder = data[0];
        }

        console.log(`✅ New order created: ${order_id} - ₹${total}`);

        res.json({
            success: true,
            data: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            message: error.message
        });
    }
});

// Get all orders (optional - for debugging)
app.get('/api/orders', async (req, res) => {
    try {
        let orders;

        if (useMockData) {
            orders = mockOrders;
        } else {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            orders = data;
        }

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            message: error.message
        });
    }
});

// Delete an order (for testing)
app.delete('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        if (useMockData) {
            const initialLength = mockOrders.length;
            mockOrders = mockOrders.filter(order => order.order_id !== orderId);

            if (mockOrders.length < initialLength) {
                console.log(`🗑️  Deleted order: ${orderId}`);
                res.json({ success: true, message: 'Order deleted' });
            } else {
                res.status(404).json({ success: false, error: 'Order not found' });
            }
        } else {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('order_id', orderId);

            if (error) throw error;
            console.log(`🗑️  Deleted order: ${orderId}`);
            res.json({ success: true, message: 'Order deleted' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MyEzz Restaurant Backend Server');
    console.log('='.repeat(60));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Metrics endpoint: http://localhost:${PORT}/api/metrics/today`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 All orders: http://localhost:${PORT}/api/orders`);
    console.log('');

    if (useMockData) {
        console.log('💡 Mode: MOCK - Using in-memory data (no Supabase required)');
        console.log(`📝 Current orders in database: ${mockOrders.length}`);
        console.log('💭 To use Supabase: Add credentials to backend/.env file');
    } else {
        console.log('💡 Mode: PRODUCTION - Connected to Supabase');
        console.log('📝 Using live database');
    }

    console.log('='.repeat(60) + '\n');
});
