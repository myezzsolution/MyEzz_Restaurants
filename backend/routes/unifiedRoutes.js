/**
 * MyEzz Unified API Routes
 * API endpoints for order management across User App, Restaurant, and Rider
 */

import express from 'express';

const createUnifiedRoutes = (orderService, realtimeServer) => {
    const router = express.Router();

    // ========================================
    // PUBLIC ENDPOINTS (User App)
    // ========================================

    /**
     * POST /api/unified/orders
     * Create a new order from user app
     */
    router.post('/orders', async (req, res) => {
        try {
            const orderData = req.body;

            // Validate required fields
            const required = ['customerName', 'customerPhone', 'deliveryAddress', 'restaurantId', 'restaurantName', 'items', 'total'];
            const missing = required.filter(field => !orderData[field]);
            
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Missing required fields: ${missing.join(', ')}`
                });
            }

            const order = await orderService.createOrder(orderData);

            res.status(201).json({
                success: true,
                data: order,
                message: 'Order placed successfully! Waiting for restaurant confirmation.'
            });

        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to create order'
            });
        }
    });

    /**
     * GET /api/unified/orders/:orderId
     * Get order details by order ID
     */
    router.get('/orders/:orderId', async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await orderService.getOrderById(orderId);

            res.json({
                success: true,
                data: order
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message || 'Order not found'
            });
        }
    });

    /**
     * GET /api/unified/orders/:orderId/track
     * Get order tracking information
     */
    router.get('/orders/:orderId/track', async (req, res) => {
        try {
            const { orderId } = req.params;
            const tracking = await orderService.trackOrder(orderId);

            res.json({
                success: true,
                data: tracking
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message || 'Order not found'
            });
        }
    });

    /**
     * GET /api/unified/customer/:customerId/orders
     * Get orders for a specific customer
     */
    router.get('/customer/:customerId/orders', async (req, res) => {
        try {
            const { customerId } = req.params;
            const { limit } = req.query;
            
            const orders = await orderService.getCustomerOrders(customerId, parseInt(limit) || 20);

            res.json({
                success: true,
                data: orders
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch orders'
            });
        }
    });

    // ========================================
    // RESTAURANT ENDPOINTS
    // ========================================

    /**
     * GET /api/unified/restaurant/:restaurantId/orders
     * Get orders for a specific restaurant
     */
    router.get('/restaurant/:restaurantId/orders', async (req, res) => {
        try {
            const { restaurantId } = req.params;
            const { status, limit } = req.query;

            let statusFilter = null;
            if (status === 'active') {
                statusFilter = ['pending_restaurant', 'preparing', 'ready_for_pickup'];
            } else if (status) {
                statusFilter = status;
            }

            const orders = await orderService.getRestaurantOrders(
                parseInt(restaurantId),
                statusFilter,
                parseInt(limit) || 50
            );

            res.json({
                success: true,
                data: orders,
                count: orders.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch orders'
            });
        }
    });

    /**
     * GET /api/unified/restaurant/:restaurantId/orders/pending
     * Get pending orders awaiting restaurant action
     */
    router.get('/restaurant/:restaurantId/orders/pending', async (req, res) => {
        try {
            const { restaurantId } = req.params;
            
            const orders = await orderService.getRestaurantOrders(
                parseInt(restaurantId),
                'pending_restaurant',
                50
            );

            res.json({
                success: true,
                data: orders,
                count: orders.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch pending orders'
            });
        }
    });

    /**
     * POST /api/unified/restaurant/:restaurantId/orders/:orderId/accept
     * Restaurant accepts an order
     */
    router.post('/restaurant/:restaurantId/orders/:orderId/accept', async (req, res) => {
        try {
            const { restaurantId, orderId } = req.params;
            const { prepTime } = req.body;

            const order = await orderService.acceptOrder(
                orderId,
                parseInt(restaurantId),
                parseInt(prepTime) || 20
            );

            res.json({
                success: true,
                data: order,
                message: 'Order accepted successfully'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to accept order'
            });
        }
    });

    /**
     * POST /api/unified/restaurant/:restaurantId/orders/:orderId/reject
     * Restaurant rejects an order
     */
    router.post('/restaurant/:restaurantId/orders/:orderId/reject', async (req, res) => {
        try {
            const { restaurantId, orderId } = req.params;
            const { reason } = req.body;

            const order = await orderService.rejectOrder(
                orderId,
                parseInt(restaurantId),
                reason || 'Restaurant is currently unavailable'
            );

            res.json({
                success: true,
                data: order,
                message: 'Order rejected'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to reject order'
            });
        }
    });

    /**
     * POST /api/unified/restaurant/:restaurantId/orders/:orderId/ready
     * Mark order as ready for pickup
     */
    router.post('/restaurant/:restaurantId/orders/:orderId/ready', async (req, res) => {
        try {
            const { restaurantId, orderId } = req.params;

            const order = await orderService.markReadyForPickup(
                orderId,
                parseInt(restaurantId)
            );

            res.json({
                success: true,
                data: order,
                message: 'Order marked as ready for pickup'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to update order'
            });
        }
    });

    // ========================================
    // RIDER INTEGRATION ENDPOINTS
    // ========================================

    /**
     * POST /api/unified/orders/:orderId/rider-assigned
     * Called when rider accepts the order (webhook from rider backend)
     */
    router.post('/orders/:orderId/rider-assigned', async (req, res) => {
        try {
            const { orderId } = req.params;
            const { riderId, riderName, riderPhone } = req.body;

            const order = await orderService.updateOrderStatus(orderId, 'rider_assigned', {
                assigned_rider_id: riderId,
                rider_name: riderName,
                rider_phone: riderPhone
            });

            // Notify via WebSocket
            if (realtimeServer) {
                realtimeServer.broadcastOrderUpdate(orderId, {
                    status: 'rider_assigned',
                    riderName,
                    message: `${riderName} is picking up your order`
                });
            }

            res.json({
                success: true,
                data: order
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/unified/orders/:orderId/picked-up
     * Called when rider picks up the order
     */
    router.post('/orders/:orderId/picked-up', async (req, res) => {
        try {
            const { orderId } = req.params;

            const order = await orderService.updateOrderStatus(orderId, 'picked_up', {
                picked_up_at: new Date().toISOString()
            });

            if (realtimeServer) {
                realtimeServer.broadcastOrderUpdate(orderId, {
                    status: 'picked_up',
                    message: 'Your order has been picked up!'
                });
            }

            res.json({
                success: true,
                data: order
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/unified/orders/:orderId/out-for-delivery
     * Called when rider starts delivery
     */
    router.post('/orders/:orderId/out-for-delivery', async (req, res) => {
        try {
            const { orderId } = req.params;

            const order = await orderService.updateOrderStatus(orderId, 'out_for_delivery');

            if (realtimeServer) {
                realtimeServer.broadcastOrderUpdate(orderId, {
                    status: 'out_for_delivery',
                    message: 'Your order is on the way!'
                });
            }

            res.json({
                success: true,
                data: order
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/unified/orders/:orderId/delivered
     * Called when order is delivered
     */
    router.post('/orders/:orderId/delivered', async (req, res) => {
        try {
            const { orderId } = req.params;
            const { verificationCode } = req.body;

            // Verify the code
            const order = await orderService.getOrderById(orderId);
            if (verificationCode && order.verificationCode !== verificationCode.toUpperCase()) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid verification code'
                });
            }

            const updatedOrder = await orderService.updateOrderStatus(orderId, 'delivered', {
                delivered_at: new Date().toISOString()
            });

            if (realtimeServer) {
                realtimeServer.broadcastOrderUpdate(orderId, {
                    status: 'delivered',
                    message: 'Order delivered successfully!'
                });
            }

            res.json({
                success: true,
                data: updatedOrder,
                message: 'Order marked as delivered'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });

    // ========================================
    // ADMIN/DEBUG ENDPOINTS
    // ========================================

    /**
     * GET /api/unified/health
     * Health check endpoint
     */
    router.get('/health', (req, res) => {
        const stats = realtimeServer ? realtimeServer.getStats() : null;
        
        res.json({
            success: true,
            status: 'healthy',
            service: 'MyEzz Unified Order API',
            timestamp: new Date().toISOString(),
            websocket: stats
        });
    });

    /**
     * POST /api/unified/orders/:orderId/status
     * Generic status update (admin use)
     */
    router.post('/orders/:orderId/status', async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status, ...additionalData } = req.body;

            const order = await orderService.updateOrderStatus(orderId, status, additionalData);

            res.json({
                success: true,
                data: order
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });

    return router;
};

export default createUnifiedRoutes;
