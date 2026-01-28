/**
 * MyEzz Real-time WebSocket Server
 * Handles real-time communication between User App, Restaurant, and Rider
 * 
 * Socket Rooms:
 * - restaurant_{id} : All connections from a specific restaurant dashboard
 * - customer_{id}   : All connections from a specific customer
 * - rider_{id}      : All connections from a specific rider
 * - order_{id}      : All parties interested in a specific order
 */

import { Server } from 'socket.io';

class RealtimeServer {
    constructor(httpServer, options = {}) {
        this.io = new Server(httpServer, {
            cors: {
                origin: options.corsOrigins || [
                    'http://localhost:3000',
                    'http://localhost:5173',
                    'http://localhost:5174',
                    'https://myezz.in',
                    'https://restaurant.myezz.in',
                    'https://rider.myezz.in'
                ],
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.connectedClients = new Map();
        this.setupEventHandlers();
    }

    /**
     * Get Socket.io instance
     */
    getIO() {
        return this.io;
    }

    /**
     * Setup main event handlers
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Authentication and room joining
            socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
            
            // Restaurant events
            socket.on('restaurant:join', (restaurantId) => this.joinRestaurantRoom(socket, restaurantId));
            socket.on('restaurant:order_update', (data) => this.handleRestaurantOrderUpdate(socket, data));
            
            // Customer events
            socket.on('customer:join', (customerId) => this.joinCustomerRoom(socket, customerId));
            socket.on('customer:track_order', (orderId) => this.joinOrderRoom(socket, orderId));
            
            // Rider events
            socket.on('rider:join', (riderId) => this.joinRiderRoom(socket, riderId));
            socket.on('rider:location_update', (data) => this.handleRiderLocationUpdate(socket, data));
            socket.on('rider:order_update', (data) => this.handleRiderOrderUpdate(socket, data));

            // Generic order subscription
            socket.on('order:subscribe', (orderId) => this.joinOrderRoom(socket, orderId));
            socket.on('order:unsubscribe', (orderId) => this.leaveOrderRoom(socket, orderId));

            // Disconnect handling
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    /**
     * Handle client authentication
     */
    handleAuthentication(socket, data) {
        const { type, id, token } = data;
        
        // TODO: Verify token with Supabase/JWT
        // For now, trust the client
        
        this.connectedClients.set(socket.id, {
            type, // 'restaurant', 'customer', 'rider'
            id,
            connectedAt: new Date()
        });

        socket.emit('authenticated', { success: true });
        console.log(`✅ Client authenticated: ${type} - ${id}`);
    }

    /**
     * Join restaurant room
     */
    joinRestaurantRoom(socket, restaurantId) {
        const room = `restaurant_${restaurantId}`;
        socket.join(room);
        console.log(`🏪 Socket ${socket.id} joined restaurant room: ${room}`);
        
        socket.emit('room_joined', { room, restaurantId });
    }

    /**
     * Join customer room
     */
    joinCustomerRoom(socket, customerId) {
        const room = `customer_${customerId}`;
        socket.join(room);
        console.log(`👤 Socket ${socket.id} joined customer room: ${room}`);
        
        socket.emit('room_joined', { room, customerId });
    }

    /**
     * Join rider room
     */
    joinRiderRoom(socket, riderId) {
        const room = `rider_${riderId}`;
        socket.join(room);
        console.log(`🛵 Socket ${socket.id} joined rider room: ${room}`);
        
        socket.emit('room_joined', { room, riderId });
    }

    /**
     * Join order room for tracking
     */
    joinOrderRoom(socket, orderId) {
        const room = `order_${orderId}`;
        socket.join(room);
        console.log(`📦 Socket ${socket.id} joined order room: ${room}`);
        
        socket.emit('order_tracking_started', { orderId });
    }

    /**
     * Leave order room
     */
    leaveOrderRoom(socket, orderId) {
        const room = `order_${orderId}`;
        socket.leave(room);
        console.log(`📦 Socket ${socket.id} left order room: ${room}`);
    }

    /**
     * Handle restaurant order updates
     */
    handleRestaurantOrderUpdate(socket, data) {
        const { orderId, status, prepTime, message } = data;
        
        // Broadcast to order room
        this.io.to(`order_${orderId}`).emit('order_status_updated', {
            orderId,
            status,
            prepTime,
            message,
            source: 'restaurant',
            timestamp: new Date().toISOString()
        });

        console.log(`📝 Restaurant updated order ${orderId} to status: ${status}`);
    }

    /**
     * Handle rider location updates
     */
    handleRiderLocationUpdate(socket, data) {
        const { riderId, orderId, location, heading } = data;
        
        // Broadcast to order room
        if (orderId) {
            this.io.to(`order_${orderId}`).emit('rider_location', {
                riderId,
                location, // { lat, lng }
                heading,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle rider order updates
     */
    handleRiderOrderUpdate(socket, data) {
        const { orderId, status, message } = data;
        
        // Broadcast to order room
        this.io.to(`order_${orderId}`).emit('order_status_updated', {
            orderId,
            status,
            message,
            source: 'rider',
            timestamp: new Date().toISOString()
        });

        console.log(`🛵 Rider updated order ${orderId} to status: ${status}`);
    }

    /**
     * Handle client disconnect
     */
    handleDisconnect(socket) {
        const clientInfo = this.connectedClients.get(socket.id);
        this.connectedClients.delete(socket.id);
        
        console.log(`❌ Client disconnected: ${socket.id}`, clientInfo || '(unknown)');
    }

    // ========================================
    // Server-side emission methods
    // (Called by OrderService)
    // ========================================

    /**
     * Notify restaurant of new order
     */
    notifyNewOrder(restaurantId, order) {
        this.io.to(`restaurant_${restaurantId}`).emit('new_order', {
            order,
            message: 'New order received!',
            sound: true,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Notify customer of order update
     */
    notifyCustomer(customerId, event, data) {
        this.io.to(`customer_${customerId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Notify rider of order assignment
     */
    notifyRider(riderId, event, data) {
        this.io.to(`rider_${riderId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Broadcast order status change to all interested parties
     */
    broadcastOrderUpdate(orderId, data) {
        this.io.to(`order_${orderId}`).emit('order_updated', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get connected clients count
     */
    getStats() {
        return {
            totalConnections: this.io.engine.clientsCount,
            authenticatedClients: this.connectedClients.size,
            clientsByType: this.getClientsByType()
        };
    }

    /**
     * Get clients grouped by type
     */
    getClientsByType() {
        const byType = { restaurant: 0, customer: 0, rider: 0, unknown: 0 };
        
        for (const client of this.connectedClients.values()) {
            if (byType.hasOwnProperty(client.type)) {
                byType[client.type]++;
            } else {
                byType.unknown++;
            }
        }
        
        return byType;
    }
}

export default RealtimeServer;
