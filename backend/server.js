import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// CENTRAL BACKEND CONFIGURATION (MongoDB Orders)
// ============================================
const CENTRAL_BACKEND_URL = process.env.CENTRAL_BACKEND_URL || 'http://localhost:4000';

// ============================================
// ROOT ROUTE — Health Check
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MyEzz Restaurant Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: ['/api/auth/login', '/api/auth/signup'],
      menu: ['/api/menu', '/api/categories'],
      restaurant: ['/api/restaurant'],
      orders: ['/api/orders/active', '/api/orders', '/api/orders/:id', '/api/orders/:id/status'],
      reports: ['/api/reports/sales', '/api/reports/orders', '/api/reports/menu', '/api/reports/heatmap', '/api/reports/customers'],
      metrics: ['/api/metrics/today'],
      health: ['/health']
    }
  });
});

// Check if Supabase credentials are available
const hasSupabaseCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
let supabase = null;
let useMockData = !hasSupabaseCredentials;

// Initialize Supabase
console.log('DEBUG: Environment Variables Check:', { 
    hasUrl: !!process.env.SUPABASE_URL, 
    hasKey: !!process.env.SUPABASE_ANON_KEY,
    cwd: process.cwd()
});

if (hasSupabaseCredentials) {
    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

        // Test connection — only check restaurants table.
        // Orders live in MongoDB (Central Backend), not Supabase.
        const { error: resError } = await supabase.from('restaurants').select('id').limit(1);
        
        if (resError) {
            console.warn('⚠️  Supabase connection check failed, falling back to mock data');
            console.error('DEBUG: Restaurant Error:', resError);
            useMockData = true;
        } else {
            console.log('✅ Successfully connected to Supabase');
            useMockData = false;
        }
    } catch (error) {
        console.warn('⚠️  Failed to initialize Supabase, using mock data:', error.message);
        console.error('DEBUG: Init Exception:', error);
        useMockData = true;
    }
} else {
    console.warn('⚠️  No credentials found in process.env');
}

// RESTAURANT ID LOGIC
// Defaults to 2 (BE Bytes) if not specified in query param ?restaurantId=X
const getRestaurantId = (req) => {
    const id = req.query.restaurantId || req.headers['x-restaurant-id'];
    return id ? parseInt(id) : 2;
};

// ============================================
// AUTHENTICATION API ENDPOINTS
// ============================================
import bcrypt from 'bcrypt';

// Restaurant Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password are required' 
            });
        }

        if (useMockData) {
            return res.status(503).json({ 
                success: false, 
                error: 'Authentication requires Supabase connection' 
            });
        }

        // Find user by username
        const { data: authRecord, error } = await supabase
            .from('restaurant_auth')
            .select('id, restaurant_id, username, password_hash')
            .eq('username', username.toLowerCase().trim())
            .single();

        if (error || !authRecord) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        // Compare password with hash
        const isValidPassword = await bcrypt.compare(password, authRecord.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        // Fetch restaurant details
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('id', authRecord.restaurant_id)
            .single();

        console.log(`✅ Login successful: ${restaurant?.name || authRecord.restaurant_id}`);

        res.json({
            success: true,
            data: {
                restaurantId: authRecord.restaurant_id,
                restaurantName: restaurant?.name || 'Restaurant',
                username: authRecord.username
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// Restaurant Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { restaurantName, ownerName, mobile, email, password, city, businessType } = req.body;

        // Validate required fields
        if (!restaurantName || !ownerName || !mobile || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields are required' 
            });
        }

        if (useMockData) {
            return res.status(503).json({ 
                success: false, 
                error: 'Signup requires Supabase connection' 
            });
        }

        // Check if username/email already exists
        const { data: existingUser } = await supabase
            .from('restaurant_auth')
            .select('id')
            .eq('username', email.toLowerCase().trim())
            .single();

        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                error: 'Email already registered' 
            });
        }

        // 1. Create restaurant entry (only using columns that exist in schema)
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
                name: restaurantName
            })
            .select()
            .single();

        if (restaurantError) {
            console.error('Restaurant creation error:', restaurantError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create restaurant profile' 
            });
        }

        // 2. Hash password and create auth credentials
        const passwordHash = await bcrypt.hash(password, 10);
        
        const { error: authError } = await supabase
            .from('restaurant_auth')
            .insert({
                restaurant_id: restaurant.id,
                username: email.toLowerCase().trim(),
                password_hash: passwordHash
            });

        if (authError) {
            console.error('Auth creation error:', authError);
            // Rollback: delete the restaurant we just created
            await supabase.from('restaurants').delete().eq('id', restaurant.id);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create authentication' 
            });
        }

        console.log(`✅ Signup successful: ${restaurantName} (ID: ${restaurant.id})`);

        res.json({
            success: true,
            data: {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                username: email.toLowerCase().trim()
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, error: 'Signup failed' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'MyEzz Restaurant API is running',
        mode: useMockData ? 'MOCK - No Supabase required' : 'PRODUCTION - Connected to Supabase'
    });
});

// --- MOCK DATA TRUTH STORE (For Reports Fallback) ---
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

const mockMenuItems = [
    { id: 101, name: 'Paneer Butter Masala', category: 'Main Course', price: 250, isVeg: true, inStock: true },
    { id: 102, name: 'Chicken Biryani', category: 'Main Course', price: 300, isVeg: false, inStock: true },
    { id: 103, name: 'Veg Hakka Noodles', category: 'Main Course', price: 180, isVeg: true, inStock: true },
    { id: 104, name: 'Mango Juice', category: 'Beverages', price: 120, isVeg: true, inStock: true },
    { id: 105, name: 'Garlic Naan', category: 'Breads', price: 50, isVeg: true, inStock: true },
];

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

// Helper: Check if we should use mock for reports.
// Orders live in MongoDB (Central Backend), not Supabase,
// so Supabase-based report queries always use mock data.
const checkReportMockStatus = async () => {
    return true;
};

app.get('/api/metrics/today', async (req, res) => {
    try {
        // Fallback to mock if orders table is missing
        const isReportsMock = await checkReportMockStatus();

        if (isReportsMock) {
            // Calculate Today's Totals from mockStore
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
                    hourlyTrend: mockStore.today.map(d => d.sales),
                    percentChange: {
                        gmv: calcChange(todaySales, yestSales),
                        orders: calcChange(todayOrders, yestOrders),
                        aov: calcChange(todayAOV, yestAOV)
                    }
                }
            });
            return;
        }

        // ... Existing Supabase Logic from User's Branch + Reports additions ...
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Fetch Today's Orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total, created_at')
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

        // Calculate Hourly Trend (9 AM to 9 PM window)
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

// Update Restaurant Details
app.put('/api/restaurant', async (req, res) => {
    try {
        const id = getRestaurantId(req);
        const { name, business_name, gstin } = req.body;

        if (useMockData) {
            // Mock update
            return res.json({ success: true, data: { ...req.body, id } });
        }

        const { data, error } = await supabase
            .from('restaurants')
            .update({ name, business_name, gstin })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ success: false, error: 'Failed to update restaurant details' });
    }
});

// Get Restaurant Details
app.get('/api/restaurant', async (req, res) => {
    try {
        const id = getRestaurantId(req);
        if (useMockData) return res.json({ success: true, data: { name: 'Mock Restaurant' } });

        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch restaurant details' });
    }
});

// ============================================
// Menu Items API Endpoints
// ============================================

// Get all menu items
app.get('/api/menu', async (req, res) => {
    try {
        if (useMockData) {
            console.log('DEBUG: Serving Mock Menu Items');
            return res.json({ success: true, data: mockMenuItems }); 
        }

        const restaurantId = getRestaurantId(req);

        // Fetch items joined with categories
        const { data, error } = await supabase
            .from('menu_items')
            .select('*, categories(name)')
            .eq('restaurant_id', restaurantId)
            .order('name');

        if (error) throw error;

        // Transform to frontend format
        const transformedItems = data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.categories?.name || 'Uncategorized',
            price: parseFloat(item.price),
            inStock: true, 
            isVeg: item.is_veg,
            imageUrl: null 
        }));

        res.json({
            success: true,
            data: transformedItems
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
    }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        if (useMockData) return res.json({ success: true, data: [] });

        const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
});

// Add menu item
app.post('/api/menu', async (req, res) => {
    try {
        const { name, category, price, isVeg } = req.body;

        if (useMockData) return res.status(500).json({ error: 'Supabase not connected' });

        // 1. Find category ID from name
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', category)
            .single();
        
        if (catError) {
             console.error('Category lookup failed:', catError);
             return res.status(400).json({ error: 'Invalid category' });
        }

        // 2. Insert item
        const { data, error } = await supabase
            .from('menu_items')
            .insert([{
                name,
                category_id: catData.id,
                price,
                is_veg: isVeg,
                restaurant_id: getRestaurantId(req),
            }])
            .select();

        if (error) throw error;

        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete menu item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (useMockData) return res.status(500).json({ error: 'Supabase not connected' });

        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ORDER MANAGEMENT — PROXY TO CENTRAL BACKEND
// ============================================

/**
 * Forward a request to the Central Backend (MongoDB).
 * Returns { data, status } or throws on network failure.
 */
async function proxyCentralBackend(endpoint, method = 'GET', body = null, queryParams = {}) {
    const url = new URL(endpoint, CENTRAL_BACKEND_URL);
    Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== undefined && queryParams[key] !== null) {
            url.searchParams.append(key, queryParams[key]);
        }
    });

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Source': 'MyEzz-Restaurant-Backend'
        }
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    console.log(`📡 Proxy ${method} ${url.toString()}`);

    const response = await fetch(url.toString(), options);
    const data = await response.json();

    if (!response.ok) {
        console.error(`❌ Central Backend ${response.status}:`, data);
    }

    return { data, status: response.status };
}

// GET /api/orders/active — used by RestaurantContext polling
app.get('/api/orders/active', async (req, res) => {
    try {
        const restaurantId = getRestaurantId(req);
        const { data, status } = await proxyCentralBackend(
            '/api/orders/active', 'GET', null,
            { restaurant_id: restaurantId }
        );
        res.status(status).json(data);
    } catch (error) {
        console.error('❌ /api/orders/active:', error.message);
        res.status(500).json({ success: false, error: 'Order service unavailable' });
    }
});

// GET /api/orders — order history with optional filters
app.get('/api/orders', async (req, res) => {
    try {
        const restaurantId = getRestaurantId(req);
        const { status: filterStatus, date, limit } = req.query;
        const { data, status } = await proxyCentralBackend(
            '/api/orders', 'GET', null,
            {
                restaurant_id: restaurantId,
                ...(filterStatus && { status: filterStatus }),
                ...(date && { date }),
                ...(limit && { limit })
            }
        );
        res.status(status).json(data);
    } catch (error) {
        console.error('❌ /api/orders:', error.message);
        res.status(500).json({ success: false, error: 'Order service unavailable' });
    }
});

// PATCH /api/orders/:id/status — frontend uses PATCH via centralOrderService
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;
        const restaurantId = getRestaurantId(req);

        const { data, status } = await proxyCentralBackend(
            `/api/orders/${id}/status`, 'PATCH',
            { status: newStatus, restaurant_id: restaurantId }
        );
        res.status(status).json(data);
    } catch (error) {
        console.error('❌ PATCH /api/orders/:id/status:', error.message);
        res.status(500).json({ success: false, error: 'Order service unavailable' });
    }
});

// PUT /api/orders/:id/status — alternate verb accepted
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;
        const restaurantId = getRestaurantId(req);

        const { data, status } = await proxyCentralBackend(
            `/api/orders/${id}/status`, 'PUT',
            { status: newStatus, restaurant_id: restaurantId }
        );
        res.status(status).json(data);
    } catch (error) {
        console.error('❌ PUT /api/orders/:id/status:', error.message);
        res.status(500).json({ success: false, error: 'Order service unavailable' });
    }
});

// GET /api/orders/:id — single order detail
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = getRestaurantId(req);
        const { data, status } = await proxyCentralBackend(
            `/api/orders/${id}`, 'GET', null,
            { restaurant_id: restaurantId }
        );
        res.status(status).json(data);
    } catch (error) {
        console.error('❌ /api/orders/:id:', error.message);
        res.status(500).json({ success: false, error: 'Order service unavailable' });
    }
});

// --- REPORTS API ENDPOINTS ---

// 1. Sales Trend Data
app.get('/api/reports/sales', async (req, res) => {
    const isMock = await checkReportMockStatus();
    console.log(`DEBUG: GET /api/reports/sales - Mode: ${isMock ? 'MOCK' : 'REAL'}`);
    try {
        const { range } = req.query; // 'today', 'yesterday', '7days'

        if (isMock) {
            let data = [];
            if (range === 'today') data = mockStore.today;
            else if (range === 'yesterday') data = mockStore.yesterday;
            else data = mockStore.week;

            res.json({ success: true, data });
        } else {
            const { start, end } = getDateRange(range);
            console.log(`DEBUG: Date Range: ${start} to ${end}`);

            // Fetch orders for the range (hourly aggregation fallback logic applied)
            const { data: orders, error } = await supabase
                .from('orders')
                .select('total, created_at')
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('DEBUG: Supabase Query Error:', error);
                throw error;
            }

            if (range === 'today' || range === 'yesterday') {
                const hourlyMap = {};
                orders.forEach(o => {
                    const h = new Date(o.created_at).getHours();
                    const label = `${h}:00`; 
                    if (!hourlyMap[label]) hourlyMap[label] = { time: label, sales: 0, orders: 0 };
                    hourlyMap[label].sales += parseFloat(o.total);
                    hourlyMap[label].orders += 1;
                });
                res.json({ success: true, data: Object.values(hourlyMap) });
            } else {
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
        console.error('DEBUG: Sales Report Handler Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Order Stats
app.get('/api/reports/orders', async (req, res) => {
    try {
        const { range } = req.query;
        const isMock = await checkReportMockStatus();

        if (isMock) {
            let factor = 1;
            if (range === 'today') factor = 0.15;
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
        const isMock = await checkReportMockStatus();

        if (isMock) {
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
            const { data: orders, error } = await supabase
                .from('orders')
                .select('items, total')
                .gte('created_at', start)
                .lte('created_at', end);

            if (error) throw error;

            const itemStats = {};
            orders.forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const name = item.name;
                        if (!itemStats[name]) itemStats[name] = { name, orders: 0, revenue: 0 };
                        itemStats[name].orders += (item.quantity || 1);
                        if (item.price) itemStats[name].revenue += (item.price * (item.quantity || 1));
                    });
                }
            });

            const allItems = Object.values(itemStats);
            allItems.sort((a, b) => b.orders - a.orders);
            const topItems = allItems.slice(0, 5);
            const leastItems = allItems.slice(-5).reverse();

            res.json({
                success: true,
                data: { topItems, leastItems }
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
        const isMock = await checkReportMockStatus();

        if (isMock) {
            // Mock data...
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
                const ampm = h >= 12 ? 'PM' : 'AM';
                const hour12 = h % 12 || 12;
                const label = `${hour12} ${ampm}`;
                if (!hoursMap[label]) hoursMap[label] = 0;
                hoursMap[label]++;
            });

            const data = Object.keys(hoursMap).map(key => ({
                name: key,
                value: hoursMap[key]
            }));
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
        const isMock = await checkReportMockStatus();
        if (isMock) {
            res.json({
                success: true,
                data: {
                    newCustomers: 45,
                    returningCustomers: 83,
                    repeatRate: 65,
                    avgOrdersPerCustomer: 2.4
                }
            });
        } else {
            const { start, end } = getDateRange(range);
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
            
            let returning = 0;
            let newCust = 0;
            Object.values(customerCounts).forEach(count => {
                if (count > 1) returning++;
                else newCust++;
            });
            const repeatRate = uniqueCustomers ? Math.round((returning / uniqueCustomers) * 100) : 0;

            res.json({
                success: true,
                data: { newCustomers: newCust, returningCustomers: returning, repeatRate, avgOrdersPerCustomer }
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


// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MyEzz Restaurant Backend Server');
    console.log('='.repeat(60));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔗 Central Backend: ${CENTRAL_BACKEND_URL}`);
    console.log(`📊 Metrics: http://localhost:${PORT}/api/metrics/today`);
    console.log(`💚 Health:  http://localhost:${PORT}/health`);
    console.log(`📦 Orders:  http://localhost:${PORT}/api/orders/active`);
    console.log('=' .repeat(60) + '\n');
});
