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

        // Test connection with a real query to ensure table exists
        const { error } = await supabase.from('orders').select('id').limit(1);
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

// Helper: Get Date Range for Supabase Queries
const getDateRange = (range) => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999); // End of today (or relative range end)

    const start = new Date(now);

    if (range === 'today') {
        start.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
    } else if (range === '7days') {
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
    } else if (range === '30days') {
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
    }

    return { start: start.toISOString(), end: end.toISOString() };
};


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

        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Fetch Today's Orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total, created_at') // Added created_at for hourly trend
            .gte('created_at', startOfDay.toISOString())
            .lt('created_at', endOfDay.toISOString());

        if (error) throw error;

        // Fetch Yesterday's Orders (for comparison)
        const { data: yesterdayOrders, error: yestError } = await supabase
            .from('orders')
            .select('total')
            .gte('created_at', startOfYesterday.toISOString())
            .lt('created_at', endOfYesterday.toISOString());

        if (yestError) throw yestError;

        // Calculate Today's metrics
        const totalOrders = orders.length;
        const gmv = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const averageOrderValue = totalOrders > 0 ? gmv / totalOrders : 0;

        // Calculate Yesterday's metrics
        const yestTotalOrders = yesterdayOrders.length;
        const yestGmv = yesterdayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const yestAov = yestTotalOrders > 0 ? yestGmv / yestTotalOrders : 0;

        // Helper for percent change
        const calcChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return +(((current - previous) / previous) * 100).toFixed(1);
        };

        // Calculate Hourly Trend (9 AM to 9 PM window to match mock data structure, or 24h?)
        // Mock data was 13 items. Let's do 9AM - 9PM (13 hours) or just map hours present.
        // Frontend expects array of sales numbers. 
        // Let's create a 13-hour bucket (9:00 to 21:00)
        const hourlyBuckets = Array(13).fill(0);
        orders.forEach(o => {
            const h = new Date(o.created_at).getHours();
            const index = h - 9; // 9 = index 0
            if (index >= 0 && index < 13) {
                hourlyBuckets[index] += parseFloat(o.total);
            }
        });

        res.json({
            success: true,
            data: {
                gmv: parseFloat(gmv.toFixed(2)),
                totalOrders,
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                date: startOfDay.toISOString().split('T')[0],
                hourlyTrend: hourlyBuckets,
                percentChange: {
                    gmv: calcChange(gmv, yestGmv),
                    orders: calcChange(totalOrders, yestTotalOrders),
                    aov: calcChange(averageOrderValue, yestAov)
                }
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
            const { start, end } = getDateRange(range);

            // Fetch orders for the range
            const { data: orders, error } = await supabase
                .from('orders')
                .select('total, created_at')
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by date or hour depending on range
            // For 'today'/'yesterday', we might want hourly. For others, daily.
            // But frontend SalesChart expects array of objects with 'date' (or 'time') and 'sales', 'orders'.

            if (range === 'today' || range === 'yesterday') {
                // Hourly aggregation
                // Initialize 9AM to 9PM (or full 24h?) - Mock data does 9-9. Let's do generic map.
                // Actually frontend chart handles whatever it gets? 
                // Let's just group by hour.
                const hourlyMap = {};
                orders.forEach(o => {
                    const h = new Date(o.created_at).getHours();
                    const label = `${h}:00`; // Simple label
                    if (!hourlyMap[label]) hourlyMap[label] = { time: label, sales: 0, orders: 0 };
                    hourlyMap[label].sales += parseFloat(o.total);
                    hourlyMap[label].orders += 1;
                });
                res.json({ success: true, data: Object.values(hourlyMap) });
            } else {
                // Daily aggregation
                const dailyMap = {};
                orders.forEach(o => {
                    const d = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    if (!dailyMap[d]) dailyMap[d] = { date: d, sales: 0, orders: 0 };
                    dailyMap[d].sales += parseFloat(o.total);
                    dailyMap[d].orders += 1;
                });
                res.json({ success: true, data: Object.values(dailyMap) });
            }
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Order Stats
app.get('/api/reports/orders', async (req, res) => {
    try {
        const { range } = req.query;

        // Simulate different stats based on range
        if (useMockData) {
            let factor = 1;
            if (range === 'today') factor = 0.15; // Small numbers for today
            else if (range === 'yesterday') factor = 0.14;
            else if (range === '7days') factor = 1;
            else if (range === '30days') factor = 4.2;

            res.json({
                success: true,
                data: {
                    received: Math.floor(154 * factor),
                    accepted: Math.floor(142 * factor),
                    rejected: Math.floor(8 * factor),
                    cancelled: Math.floor(4 * factor),
                    avgPrepTime: '18 min',
                    completionRate: 92
                }
            });
        } else {
            const { start, end } = getDateRange(range);

            // Count by status
            const { data: orders, error } = await supabase
                .from('orders')
                .select('status, prep_time')
                .gte('created_at', start)
                .lte('created_at', end);

            if (error) throw error;

            const stats = {
                received: 0,
                accepted: 0,
                rejected: 0,
                cancelled: 0,
                totalPrepTime: 0,
                prepCount: 0
            };

            orders.forEach(o => {
                stats.received++;
                if (['preparing', 'ready', 'completed', 'delivered'].includes(o.status)) stats.accepted++;
                if (o.status === 'rejected') stats.rejected++;
                if (o.status === 'cancelled') stats.cancelled++;

                if (o.prep_time) {
                    stats.totalPrepTime += o.prep_time;
                    stats.prepCount++;
                }
            });

            // Calculate metrics
            const avgPrepTime = stats.prepCount > 0 ? Math.round(stats.totalPrepTime / stats.prepCount) + ' min' : '0 min';
            const completionRate = stats.received > 0 ? Math.round((stats.accepted / stats.received) * 100) : 0;

            res.json({
                success: true,
                data: {
                    received: stats.received,
                    accepted: stats.accepted,
                    rejected: stats.rejected,
                    cancelled: stats.cancelled,
                    avgPrepTime,
                    completionRate
                }
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Menu Performance
app.get('/api/reports/menu', async (req, res) => {
    try {
        const { range } = req.query;

        if (useMockData) {
            // ... mock logic ...
            let factor = 1;
            if (range === 'today') factor = 0.2;
            else if (range === 'yesterday') factor = 0.18;
            else if (range === '30days') factor = 4;

            const scale = (val) => Math.floor(val * factor);

            res.json({
                success: true,
                data: {
                    topItems: [
                        { name: 'Paneer Butter Masala', orders: scale(145), revenue: scale(36250) },
                        { name: 'Chicken Biryani', orders: scale(132), revenue: scale(39600) },
                        { name: 'Garlic Naan', orders: scale(210), revenue: scale(10500) },
                        { name: 'Butter Chicken', orders: scale(98), revenue: scale(29400) },
                        { name: 'Veg Hakka Noodles', orders: scale(85), revenue: scale(15300) }
                    ],
                    leastItems: [
                        { name: 'Plain Rice', orders: scale(12), revenue: scale(1200) },
                        { name: 'Green Salad', orders: scale(8), revenue: scale(960) },
                        { name: 'Raita', orders: scale(5), revenue: scale(250) }
                    ]
                }
            });
        } else {
            const { start, end } = getDateRange(range);

            // We need to fetch items from orders
            // Assuming 'items' column is JSONB array: [{name: "...", quantity: 1, price: 100}, ...]
            const { data: orders, error } = await supabase
                .from('orders')
                .select('items, total') // items is crucial here
                .gte('created_at', start)
                .lte('created_at', end);

            if (error) throw error;

            const itemStats = {};

            orders.forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const name = item.name;
                        const price = item.price || 0; // Assuming price is in item, or derived?
                        // If price isn't in item, we might need a menu table. Assuming rudimentary structure for now.
                        // Or we can approximate revenue if not available.
                        // For this fallback, let's assume we can get quantity.

                        if (!itemStats[name]) itemStats[name] = { name, orders: 0, revenue: 0 };
                        itemStats[name].orders += (item.quantity || 1);
                        // Revenue approximation if price exists, else mock/skip
                        if (item.price) itemStats[name].revenue += (item.price * (item.quantity || 1));
                    });
                }
            });

            const allItems = Object.values(itemStats);
            allItems.sort((a, b) => b.orders - a.orders); // Sort by orders (popularity)

            const topItems = allItems.slice(0, 5);
            const leastItems = allItems.slice(-5).reverse();

            res.json({
                success: true,
                data: {
                    topItems,
                    leastItems
                }
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Busy Hours (Heatmap)
app.get('/api/reports/heatmap', async (req, res) => {
    try {
        const { range } = req.query;

        if (useMockData) {
            // ... mock logic ...
            if (range === 'today') {
                res.json({
                    success: true,
                    data: [
                        { name: '12 PM', value: 20 }, { name: '1 PM', value: 45 },
                        { name: '2 PM', value: 30 }, { name: '3 PM', value: 10 },
                        { name: '7 PM', value: 60 }, { name: '8 PM', value: 80 },
                        { name: '9 PM', value: 50 }, { name: '10 PM', value: 20 }
                    ]
                });
                return;
            }

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
        } else {
            const { start, end } = getDateRange(range);

            const { data: orders, error } = await supabase
                .from('orders')
                .select('created_at')
                .gte('created_at', start)
                .lte('created_at', end);

            if (error) throw error;

            const hoursMap = {};
            orders.forEach(o => {
                const h = new Date(o.created_at).getHours();
                // Format to AM/PM
                const ampm = h >= 12 ? 'PM' : 'AM';
                const hour12 = h % 12 || 12;
                const label = `${hour12} ${ampm}`;

                if (!hoursMap[label]) hoursMap[label] = 0;
                hoursMap[label]++;
            });

            // Convert map to array expected by chart
            const data = Object.keys(hoursMap).map(key => ({
                name: key,
                value: hoursMap[key]
            }));

            // Optional: Sort by time? Or just send as is (chart handles it?)
            // For now, sending as extracted.

            res.json({ success: true, data });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Customer Insights
app.get('/api/reports/customers', async (req, res) => {
    try {
        const { range } = req.query;

        if (useMockData) {
            let factor = 1;
            if (range === 'today') factor = 0.1;
            else if (range === '30days') factor = 4;

            res.json({
                success: true,
                data: {
                    newCustomers: Math.floor(45 * factor),
                    returningCustomers: Math.floor(83 * factor),
                    repeatRate: 65,
                    avgOrdersPerCustomer: 2.4
                }
            });
        } else {
            const { start, end } = getDateRange(range);

            // To properly calc "new" vs "returning", we need historical data outside the range, 
            // but for simpler dashboard logic, let's just count unique customers in this range
            // and maybe check if they have orders prior to 'start'.

            const { data: orders, error } = await supabase
                .from('orders')
                .select('customer_name, created_at')
                .gte('created_at', start)
                .lte('created_at', end);

            if (error) throw error;

            const customerCounts = {};
            orders.forEach(o => {
                const name = o.customer_name;
                if (!customerCounts[name]) customerCounts[name] = 0;
                customerCounts[name]++;
            });

            const uniqueCustomers = Object.keys(customerCounts).length;
            const totalOrders = orders.length;
            const avgOrdersPerCustomer = uniqueCustomers ? (totalOrders / uniqueCustomers).toFixed(1) : 0;

            // For New vs Returning, without a customers table, we can just randomly split or assume distinct names > 1 order = returning?
            // Let's assume returning = customerCounts[name] > 1 in this period (simplification)

            let returning = 0;
            let newCust = 0;

            Object.values(customerCounts).forEach(count => {
                if (count > 1) returning++;
                else newCust++;
            });

            const repeatRate = uniqueCustomers ? Math.round((returning / uniqueCustomers) * 100) : 0;

            res.json({
                success: true,
                data: {
                    newCustomers: newCust,
                    returningCustomers: returning,
                    repeatRate,
                    avgOrdersPerCustomer
                }
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
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


