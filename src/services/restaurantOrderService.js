/**
 * Restaurant Order Service
 * Handles order management for Restaurant Dashboard
 */

import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

let socket = null;

/**
 * Initialize WebSocket connection for restaurant
 */
export const initializeSocket = (restaurantId, callbacks = {}) => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('🔌 Connected to order server');
        
        socket.emit('authenticate', {
            type: 'restaurant',
            id: restaurantId
        });
        
        socket.emit('restaurant:join', restaurantId);

        if (callbacks.onConnect) callbacks.onConnect();
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from order server');
        if (callbacks.onDisconnect) callbacks.onDisconnect();
    });

    socket.on('new_order', (data) => {
        console.log('🆕 New order received:', data);
        // Play notification sound
        playNotificationSound();
        if (callbacks.onNewOrder) callbacks.onNewOrder(data);
    });

    socket.on('order_updated', (data) => {
        console.log('📝 Order updated:', data);
        if (callbacks.onOrderUpdate) callbacks.onOrderUpdate(data);
    });

    socket.on('order_status_changed', (data) => {
        console.log('📋 Order status changed:', data);
        if (callbacks.onStatusChange) callbacks.onStatusChange(data);
    });

    return socket;
};

/**
 * Play notification sound for new orders
 */
const playNotificationSound = () => {
    try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (e) {
        console.log('Notification sound not available');
    }
};

/**
 * Disconnect from WebSocket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

/**
 * Fetch orders from unified API
 */
export const fetchOrders = async (restaurantId, status = 'active') => {
    const response = await fetch(
        `${API_URL}/api/unified/restaurant/${restaurantId}/orders?status=${status}`,
        { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch orders');
    }
    
    return response.json();
};

/**
 * Fetch pending orders awaiting action
 */
export const fetchPendingOrders = async (restaurantId) => {
    const response = await fetch(
        `${API_URL}/api/unified/restaurant/${restaurantId}/orders/pending`,
        { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch pending orders');
    }
    
    return response.json();
};

/**
 * Accept an order
 */
export const acceptOrder = async (restaurantId, orderId, prepTime = 20) => {
    const response = await fetch(
        `${API_URL}/api/unified/restaurant/${restaurantId}/orders/${orderId}/accept`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prepTime })
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept order');
    }
    
    return response.json();
};

/**
 * Reject an order
 */
export const rejectOrder = async (restaurantId, orderId, reason) => {
    const response = await fetch(
        `${API_URL}/api/unified/restaurant/${restaurantId}/orders/${orderId}/reject`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject order');
    }
    
    return response.json();
};

/**
 * Mark order as ready for pickup
 */
export const markOrderReady = async (restaurantId, orderId) => {
    const response = await fetch(
        `${API_URL}/api/unified/restaurant/${restaurantId}/orders/${orderId}/ready`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark order ready');
    }
    
    return response.json();
};

/**
 * Get order status label and color
 */
export const getStatusDisplay = (status) => {
    const statusMap = {
        'pending_restaurant': { label: 'New Order', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', badge: '🔴' },
        'preparing': { label: 'Preparing', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', badge: '🟡' },
        'ready_for_pickup': { label: 'Ready', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', badge: '🟢' },
        'rider_assigned': { label: 'Rider Assigned', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800', badge: '🔵' },
        'picked_up': { label: 'Picked Up', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800', badge: '🟣' },
        'out_for_delivery': { label: 'Out for Delivery', color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800', badge: '📦' },
        'delivered': { label: 'Delivered', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', badge: '✅' },
        'rejected': { label: 'Rejected', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800', badge: '❌' },
        'cancelled': { label: 'Cancelled', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800', badge: '🚫' }
    };

    return statusMap[status] || { label: status, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800', badge: '❓' };
};

/**
 * Format time since order was placed
 */
export const getTimeSinceOrder = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return orderTime.toLocaleDateString();
};

export default {
    initializeSocket,
    disconnectSocket,
    fetchOrders,
    fetchPendingOrders,
    acceptOrder,
    rejectOrder,
    markOrderReady,
    getStatusDisplay,
    getTimeSinceOrder
};
