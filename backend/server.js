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

// --- MOCK DATA TRUTH STORE ---
// This ensures all charts and metrics are mathematically consistent

const generateHourlyData = (hours) => {
    return Array.from({ length: hours }, (_, i) => ({
        time: `${i + 9}:00`, // 9 AM start
        sales: Math.floor(Math.random() * 4000) + 500,
        orders: Math.floor(Math.random() * 12) + 2
    }));
};

const generateDailyData = (days) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates.map(date => ({
        date,
        sales: Math.floor(Math.random() * 25000) + 8000,
        orders: Math.floor(Math.random() * 70) + 20
    }));
};

// Initialize the Truth Store
const mockStore = {
    today: generateHourlyData(13), // 9 AM to 9 PM
    yesterday: generateHourlyData(13),
    week: generateDailyData(7)
};

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MyEzz Restaurant Backend Server');
    console.log('='.repeat(60));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    // ... rest of startup log
});


// Get today's metrics (Centralized Calculation)
app.get('/api/metrics/today', async (req, res) => {
    try {
        if (useMockData) {
            // Calculate Today's Totals
            const todaySales = mockStore.today.reduce((acc, curr) => acc + curr.sales, 0);
            const todayOrders = mockStore.today.reduce((acc, curr) => acc + curr.orders, 0);
            const todayAOV = todayOrders > 0 ? (todaySales / todayOrders) : 0;

            // Calculate Yesterday's Totals (for comparison)
            const yestSales = mockStore.yesterday.reduce((acc, curr) => acc + curr.sales, 0);
            const yestOrders = mockStore.yesterday.reduce((acc, curr) => acc + curr.orders, 0);
            const yestAOV = yestOrders > 0 ? (yestSales / yestOrders) : 0;

            // Calculate Percent Changes
            const calcChange = (current, previous) => {
                if (previous === 0) return 100;
                return +(((current - previous) / previous) * 100).toFixed(1);
            };

            res.json({
                success: true,
                data: {
                    gmv: todaySales,
                    totalOrders: todayOrders,
                    averageOrderValue: +todayAOV.toFixed(0),
                    date: new Date().toISOString().split('T')[0],
                    hourlyTrend: mockStore.today.map(d => d.sales), // Sparkline data matches chart!
                    percentChange: {
                        gmv: calcChange(todaySales, yestSales),
                        orders: calcChange(todayOrders, yestOrders),
                        aov: calcChange(todayAOV, yestAOV)
                    }
                }
            });
            return;
        }

        // ... Existing Supabase logic ...
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const { data: orders, error } = await supabase
            .from('orders')
            .select('total, status')
            .gte('created_at', startOfDay.toISOString())
            .lt('created_at', endOfDay.toISOString());

        if (error) throw error;

        const totalOrders = orders.length;
        const gmv = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const averageOrderValue = totalOrders > 0 ? gmv / totalOrders : 0;

        res.json({
            success: true,
            data: {
                gmv: parseFloat(gmv.toFixed(2)),
                totalOrders,
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                date: startOfDay.toISOString().split('T')[0],
                hourlyTrend: Array(12).fill(0), // Placeholder for real DB
                percentChange: { gmv: 0, orders: 0, aov: 0 } // Placeholder
            }
        });

    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ success: false, error: 'Failed' });
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
// --- REPORTS API ENDPOINTS ---

// 1. Sales Trend Data
app.get('/api/reports/sales', async (req, res) => {
    try {
        const { range } = req.query; // 'today', 'yesterday', '7days'

        if (useMockData) {
            let data = [];
            if (range === 'today') data = mockStore.today;
            else if (range === 'yesterday') data = mockStore.yesterday;
            else data = mockStore.week;

            res.json({ success: true, data });
        } else {
            // ... Real DB implementations would go here
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Order Stats
app.get('/api/reports/orders', async (req, res) => {
    // In real app: SQL COUNT(*) queries
    res.json({
        success: true,
        data: {
            received: 154,
            accepted: 142,
            rejected: 8,
            cancelled: 4,
            avgPrepTime: '18 min',
            completionRate: 92
        }
    });
});

// 3. Menu Performance
app.get('/api/reports/menu', async (req, res) => {
    res.json({
        success: true,
        data: {
            topItems: [
                { name: 'Paneer Butter Masala', orders: 145, revenue: 36250 },
                { name: 'Chicken Biryani', orders: 132, revenue: 39600 },
                { name: 'Garlic Naan', orders: 210, revenue: 10500 },
                { name: 'Butter Chicken', orders: 98, revenue: 29400 },
                { name: 'Veg Hakka Noodles', orders: 85, revenue: 15300 }
            ],
            leastItems: [
                { name: 'Plain Rice', orders: 12, revenue: 1200 },
                { name: 'Green Salad', orders: 8, revenue: 960 },
                { name: 'Raita', orders: 5, revenue: 250 }
            ]
        }
    });
});

// 4. Busy Hours (Heatmap)
app.get('/api/reports/heatmap', async (req, res) => {
    res.json({
        success: true,
        data: [
            { name: '12 PM', value: 40 },
            { name: '1 PM', value: 85 },
            { name: '2 PM', value: 60 },
            { name: '3 PM', value: 20 },
            { name: '7 PM', value: 50 },
            { name: '8 PM', value: 100 },
            { name: '9 PM', value: 90 },
            { name: '10 PM', value: 45 },
        ]
    });
});

// 5. Customer Insights
app.get('/api/reports/customers', async (req, res) => {
    res.json({
        success: true,
        data: {
            newCustomers: 45,
            returningCustomers: 83,
            repeatRate: 65,
            avgOrdersPerCustomer: 2.4
        }
    });
});

// 6. Auto Insights
app.get('/api/reports/insights', async (req, res) => {
    res.json({
        success: true,
        data: [
            { type: 'warning', text: 'Orders dropped by 20% compared to yesterday around 2 PM.' },
            { type: 'success', text: 'Paneer Butter Masala is your top-selling item today!' },
            { type: 'info', text: 'Avg prep time increased by 3 mins during dinner hours.' }
        ]
    });
});


