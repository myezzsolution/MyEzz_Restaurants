/**
 * MyEzz Unified Order Service
 * Production-ready order flow management between User App → Restaurant → Rider
 * 
 * Order Flow:
 * 1. User places order → stored in Supabase with status 'pending_restaurant'
 * 2. Restaurant receives real-time notification via WebSocket
 * 3. Restaurant accepts → order moves to 'accepted', sent to Rider system
 * 4. Restaurant rejects → order marked 'rejected', user notified
 * 5. Rider accepts → order moves to 'pickup_pending'
 * 6. Status updates propagate to all connected clients in real-time
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// In-memory storage for testing when database table doesn't exist
const inMemoryOrders = new Map();

class OrderService {
    constructor(supabase, io = null) {
        this.supabase = supabase;
        this.io = io;
        this.riderBackendUrl = process.env.RIDER_BACKEND_URL || 'http://localhost:5000';
        this.useInMemory = false;
        this.checkTableExists();
    }

    async checkTableExists() {
        try {
            const { error } = await this.supabase
                .from('unified_orders')
                .select('order_id')
                .limit(1);
            
            if (error && error.code === 'PGRST205') {
                console.warn('⚠️  unified_orders table not found - using in-memory storage for testing');
                this.useInMemory = true;
            } else {
                this.useInMemory = false;
            }
        } catch (e) {
            console.warn('⚠️  Database check failed - using in-memory storage');
            this.useInMemory = true;
        }
    }

    /**
     * Set Socket.io instance for real-time updates
     */
    setSocketIO(io) {
        this.io = io;
    }

    /**
     * Generate unique order ID
     */
    generateOrderId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `MYE-${timestamp}-${random}`;
    }

    /**
     * Generate verification code for order pickup
     */
    generateVerificationCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    /**
     * Create new order from user app
     * @param {Object} orderData - Order details from user app
     * @returns {Object} Created order
     */
    async createOrder(orderData) {
        const orderId = this.generateOrderId();
        const verificationCode = this.generateVerificationCode();

        const {
            customerId,
            customerName,
            customerPhone,
            customerEmail,
            deliveryAddress,
            deliveryLocation,
            restaurantId,
            restaurantName,
            items,
            subtotal,
            deliveryFee,
            platformFee,
            total,
            paymentMethod,
            paymentStatus,
            notes
        } = orderData;

        const newOrder = {
            id: crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
            order_id: orderId,
            customer_id: customerId || null,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail || null,
            delivery_address: deliveryAddress,
            delivery_location: deliveryLocation ? JSON.stringify(deliveryLocation) : null,
            restaurant_id: restaurantId,
            restaurant_name: restaurantName,
            items: JSON.stringify(items),
            subtotal: subtotal,
            delivery_fee: deliveryFee || 30,
            platform_fee: platformFee || 8,
            total: total,
            payment_method: paymentMethod || 'cash_on_delivery',
            payment_status: paymentStatus || 'pending',
            status: 'pending_restaurant',
            verification_code: verificationCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        let data;

        if (this.useInMemory) {
            // Use in-memory storage for testing
            inMemoryOrders.set(orderId, newOrder);
            data = newOrder;
            console.log(`📦 Order ${orderId} stored in memory (table not available)`);
        } else {
            const { data: dbData, error } = await this.supabase
                .from('unified_orders')
                .insert([newOrder])
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST205') {
                    // Table doesn't exist - fall back to in-memory
                    this.useInMemory = true;
                    inMemoryOrders.set(orderId, newOrder);
                    data = newOrder;
                    console.log(`📦 Order ${orderId} stored in memory (fallback)`);
                } else {
                    console.error('Error creating order:', error);
                    throw new Error(`Failed to create order: ${error.message}`);
                }
            } else {
                data = dbData;
            }
        }

        // Emit real-time event to restaurant dashboard
        if (this.io) {
            this.io.to(`restaurant_${restaurantId}`).emit('new_order', {
                order: this.formatOrderForClient(data),
                message: 'New order received!'
            });
        }

        return this.formatOrderForClient(data);
    }

    /**
     * Get orders for a specific restaurant
     */
    async getRestaurantOrders(restaurantId, status = null, limit = 50) {
        if (this.useInMemory) {
            let orders = Array.from(inMemoryOrders.values())
                .filter(o => o.restaurant_id === restaurantId || o.restaurant_id === parseInt(restaurantId));
            
            if (status) {
                if (Array.isArray(status)) {
                    orders = orders.filter(o => status.includes(o.status));
                } else {
                    orders = orders.filter(o => o.status === status);
                }
            }
            
            orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return orders.slice(0, limit).map(order => this.formatOrderForClient(order));
        }

        let query = this.supabase
            .from('unified_orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            if (Array.isArray(status)) {
                query = query.in('status', status);
            } else {
                query = query.eq('status', status);
            }
        }

        const { data, error } = await query;

        if (error) {
            if (error.code === 'PGRST205') {
                this.useInMemory = true;
                return this.getRestaurantOrders(restaurantId, status, limit);
            }
            console.error('Error fetching restaurant orders:', error);
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }

        return data.map(order => this.formatOrderForClient(order));
    }

    /**
     * Restaurant accepts an order
     */
    async acceptOrder(orderId, restaurantId, prepTime = 20) {
        let order, data;

        if (this.useInMemory) {
            order = inMemoryOrders.get(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'pending_restaurant') {
                throw new Error(`Cannot accept order with status: ${order.status}`);
            }
            order.status = 'preparing';
            order.prep_time = prepTime;
            order.accepted_at = new Date().toISOString();
            order.updated_at = new Date().toISOString();
            inMemoryOrders.set(orderId, order);
            data = order;
        } else {
            const { data: fetchedOrder, error: fetchError } = await this.supabase
                .from('unified_orders')
                .select('*')
                .eq('order_id', orderId)
                .eq('restaurant_id', restaurantId)
                .single();

            if (fetchError || !fetchedOrder) {
                throw new Error('Order not found');
            }
            order = fetchedOrder;

            if (order.status !== 'pending_restaurant') {
                throw new Error(`Cannot accept order with status: ${order.status}`);
            }

            const { data: updatedData, error } = await this.supabase
                .from('unified_orders')
                .update({
                    status: 'preparing',
                    prep_time: prepTime,
                    accepted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('order_id', orderId)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to accept order: ${error.message}`);
            }
            data = updatedData;
        }

        // Send order to Rider system
        await this.sendToRiderSystem(data);

        // Emit real-time updates
        if (this.io) {
            this.io.to(`restaurant_${restaurantId}`).emit('order_updated', {
                order: this.formatOrderForClient(data)
            });
            this.io.to(`customer_${order.customer_id}`).emit('order_accepted', {
                orderId: orderId,
                prepTime: prepTime,
                message: `Your order is being prepared! Estimated time: ${prepTime} mins`
            });
        }

        return this.formatOrderForClient(data);
    }

    /**
     * Restaurant rejects an order
     */
    async rejectOrder(orderId, restaurantId, reason = 'Restaurant is currently unavailable') {
        let order, data;

        if (this.useInMemory) {
            order = inMemoryOrders.get(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'pending_restaurant') {
                throw new Error(`Cannot reject order with status: ${order.status}`);
            }
            order.status = 'rejected';
            order.rejection_reason = reason;
            order.rejected_at = new Date().toISOString();
            order.updated_at = new Date().toISOString();
            inMemoryOrders.set(orderId, order);
            data = order;
        } else {
            const { data: fetchedOrder, error: fetchError } = await this.supabase
                .from('unified_orders')
                .select('*')
                .eq('order_id', orderId)
                .eq('restaurant_id', restaurantId)
                .single();

            if (fetchError || !fetchedOrder) {
                throw new Error('Order not found');
            }
            order = fetchedOrder;

            if (order.status !== 'pending_restaurant') {
                throw new Error(`Cannot reject order with status: ${order.status}`);
            }

            const { data: updatedData, error } = await this.supabase
                .from('unified_orders')
                .update({
                    status: 'rejected',
                    rejection_reason: reason,
                    rejected_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('order_id', orderId)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to reject order: ${error.message}`);
            }
            data = updatedData;
        }

        // Emit real-time updates
        if (this.io) {
            this.io.to(`restaurant_${restaurantId}`).emit('order_updated', {
                order: this.formatOrderForClient(data)
            });
            this.io.to(`customer_${order.customer_id}`).emit('order_rejected', {
                orderId: orderId,
                reason: reason,
                message: 'Sorry, your order could not be accepted. Please try another restaurant.'
            });
        }

        // Initiate refund if payment was online
        if (order.payment_method === 'online' && order.payment_status === 'paid') {
            await this.initiateRefund(orderId, order.total, reason);
        }

        return this.formatOrderForClient(data);
    }

    /**
     * Update order status
     */
    async updateOrderStatus(orderId, newStatus, additionalData = {}) {
        const allowedStatuses = [
            'pending_restaurant',
            'preparing',
            'ready_for_pickup',
            'rider_assigned',
            'picked_up',
            'out_for_delivery',
            'delivered',
            'rejected',
            'cancelled'
        ];

        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        const updateData = {
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...additionalData
        };

        // Add timestamp for specific statuses
        if (newStatus === 'ready_for_pickup') {
            updateData.ready_at = new Date().toISOString();
        } else if (newStatus === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
        }

        const { data, error } = await this.supabase
            .from('unified_orders')
            .update(updateData)
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update order status: ${error.message}`);
        }

        // Broadcast status update to all relevant parties
        if (this.io) {
            this.io.emit('order_status_changed', {
                orderId: orderId,
                status: newStatus,
                order: this.formatOrderForClient(data)
            });
        }

        return this.formatOrderForClient(data);
    }

    /**
     * Mark order as ready for pickup
     */
    async markReadyForPickup(orderId, restaurantId) {
        const { data: order, error: fetchError } = await this.supabase
            .from('unified_orders')
            .select('*')
            .eq('order_id', orderId)
            .eq('restaurant_id', restaurantId)
            .single();

        if (fetchError || !order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'preparing') {
            throw new Error(`Cannot mark as ready. Current status: ${order.status}`);
        }

        return this.updateOrderStatus(orderId, 'ready_for_pickup');
    }

    /**
     * Send order to Rider backend system
     */
    async sendToRiderSystem(order) {
        try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            const deliveryLocation = typeof order.delivery_location === 'string' 
                ? JSON.parse(order.delivery_location) 
                : order.delivery_location;

            const riderOrderPayload = {
                customerName: order.customer_name,
                customerPhone: order.customer_phone,
                pickupAddress: order.restaurant_name,
                pickupLocation: {
                    type: 'Point',
                    coordinates: [0, 0] // TODO: Get from restaurant data
                },
                dropAddress: order.delivery_address,
                dropLocation: deliveryLocation || {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                items: items.map(item => ({
                    name: item.name,
                    qty: item.quantity || item.qty || 1,
                    price: item.price
                })),
                price: order.total,
                paymentMethod: order.payment_method === 'cash_on_delivery' ? 'cash_on_delivery' : 'online',
                notes: `Order ID: ${order.order_id} | Verification Code: ${order.verification_code}`,
                myezzOrderId: order.order_id // Link back to unified order
            };

            const response = await axios.post(
                `${this.riderBackendUrl}/api/orders`,
                riderOrderPayload,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            );

            // Update unified order with rider order ID
            await this.supabase
                .from('unified_orders')
                .update({
                    rider_order_id: response.data._id,
                    updated_at: new Date().toISOString()
                })
                .eq('order_id', order.order_id);

            console.log(`✅ Order ${order.order_id} sent to rider system. Rider Order ID: ${response.data._id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to send order to rider system:', error.message);
            // Don't throw - rider system failure shouldn't block restaurant
            return null;
        }
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId) {
        if (this.useInMemory) {
            const order = inMemoryOrders.get(orderId);
            if (!order) throw new Error('Order not found');
            return this.formatOrderForClient(order);
        }

        const { data, error } = await this.supabase
            .from('unified_orders')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (error) {
            if (error.code === 'PGRST205') {
                this.useInMemory = true;
                return this.getOrderById(orderId);
            }
            throw new Error('Order not found');
        }

        return this.formatOrderForClient(data);
    }

    /**
     * Get orders for a customer
     */
    async getCustomerOrders(customerId, limit = 20) {
        if (this.useInMemory) {
            const orders = Array.from(inMemoryOrders.values())
                .filter(o => o.customer_id === customerId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);
            return orders.map(order => this.formatOrderForClient(order));
        }

        const { data, error } = await this.supabase
            .from('unified_orders')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch customer orders: ${error.message}`);
        }

        return data.map(order => this.formatOrderForClient(order));
    }

    /**
     * Track order status for customers
     */
    async trackOrder(orderId) {
        const order = await this.getOrderById(orderId);
        
        const statusTimeline = [
            { status: 'pending_restaurant', label: 'Order Placed', completed: true, time: order.createdAt },
            { status: 'preparing', label: 'Restaurant Accepted', completed: ['preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery', 'delivered'].includes(order.status), time: order.acceptedAt },
            { status: 'ready_for_pickup', label: 'Ready for Pickup', completed: ['ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery', 'delivered'].includes(order.status), time: order.readyAt },
            { status: 'picked_up', label: 'Picked Up by Rider', completed: ['picked_up', 'out_for_delivery', 'delivered'].includes(order.status), time: order.pickedUpAt },
            { status: 'out_for_delivery', label: 'Out for Delivery', completed: ['out_for_delivery', 'delivered'].includes(order.status), time: null },
            { status: 'delivered', label: 'Delivered', completed: order.status === 'delivered', time: order.deliveredAt }
        ];

        return {
            order,
            timeline: statusTimeline,
            currentStatus: order.status
        };
    }

    /**
     * Initiate refund for rejected/cancelled orders
     */
    async initiateRefund(orderId, amount, reason) {
        // TODO: Implement Razorpay refund API integration
        console.log(`📛 Refund initiated for order ${orderId}: ₹${amount} - Reason: ${reason}`);
        
        await this.supabase
            .from('unified_orders')
            .update({
                refund_status: 'initiated',
                refund_amount: amount,
                refund_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);
    }

    /**
     * Format order data for client consumption
     */
    formatOrderForClient(order) {
        return {
            id: order.id,
            orderId: order.order_id,
            customerId: order.customer_id,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            customerEmail: order.customer_email,
            deliveryAddress: order.delivery_address,
            deliveryLocation: typeof order.delivery_location === 'string' 
                ? JSON.parse(order.delivery_location) 
                : order.delivery_location,
            restaurantId: order.restaurant_id,
            restaurantName: order.restaurant_name,
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
            subtotal: parseFloat(order.subtotal),
            deliveryFee: parseFloat(order.delivery_fee),
            platformFee: parseFloat(order.platform_fee),
            total: parseFloat(order.total),
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            status: order.status,
            verificationCode: order.verification_code,
            prepTime: order.prep_time,
            rejectionReason: order.rejection_reason,
            riderOrderId: order.rider_order_id,
            createdAt: order.created_at,
            acceptedAt: order.accepted_at,
            readyAt: order.ready_at,
            pickedUpAt: order.picked_up_at,
            deliveredAt: order.delivered_at,
            updatedAt: order.updated_at
        };
    }
}

export default OrderService;
