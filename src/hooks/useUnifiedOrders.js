/**
 * useUnifiedOrders Hook
 * React hook for managing unified orders in restaurant dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    initializeSocket,
    disconnectSocket,
    fetchOrders,
    fetchPendingOrders,
    acceptOrder as apiAcceptOrder,
    rejectOrder as apiRejectOrder,
    markOrderReady as apiMarkOrderReady,
    getStatusDisplay,
    getTimeSinceOrder
} from '../services/restaurantOrderService';

export const useUnifiedOrders = (restaurantId) => {
    const [orders, setOrders] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);
    const [newOrderAlert, setNewOrderAlert] = useState(null);
    
    const refreshIntervalRef = useRef(null);

    // Load orders
    const loadOrders = useCallback(async () => {
        if (!restaurantId) return;
        
        try {
            const [activeResult, pendingResult] = await Promise.all([
                fetchOrders(restaurantId, 'active'),
                fetchPendingOrders(restaurantId)
            ]);

            if (activeResult.success) {
                setOrders(activeResult.data);
            }
            if (pendingResult.success) {
                setPendingOrders(pendingResult.data);
            }
            setError(null);
        } catch (err) {
            console.error('Error loading orders:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Accept order handler
    const acceptOrder = useCallback(async (orderId, prepTime = 20) => {
        try {
            const result = await apiAcceptOrder(restaurantId, orderId, prepTime);
            
            if (result.success) {
                // Update local state
                setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
                setOrders(prev => {
                    const existing = prev.find(o => o.orderId === orderId);
                    if (existing) {
                        return prev.map(o => o.orderId === orderId ? result.data : o);
                    }
                    return [result.data, ...prev];
                });
                return { success: true, order: result.data };
            }
            return { success: false, error: result.error };
        } catch (err) {
            console.error('Error accepting order:', err);
            return { success: false, error: err.message };
        }
    }, [restaurantId]);

    // Reject order handler
    const rejectOrder = useCallback(async (orderId, reason) => {
        try {
            const result = await apiRejectOrder(restaurantId, orderId, reason);
            
            if (result.success) {
                // Remove from both lists
                setPendingOrders(prev => prev.filter(o => o.orderId !== orderId));
                setOrders(prev => prev.filter(o => o.orderId !== orderId));
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (err) {
            console.error('Error rejecting order:', err);
            return { success: false, error: err.message };
        }
    }, [restaurantId]);

    // Mark order ready handler
    const markReady = useCallback(async (orderId) => {
        try {
            const result = await apiMarkOrderReady(restaurantId, orderId);
            
            if (result.success) {
                // Update order in list
                setOrders(prev => prev.map(o => 
                    o.orderId === orderId ? result.data : o
                ));
                return { success: true, order: result.data };
            }
            return { success: false, error: result.error };
        } catch (err) {
            console.error('Error marking order ready:', err);
            return { success: false, error: err.message };
        }
    }, [restaurantId]);

    // Clear new order alert
    const clearNewOrderAlert = useCallback(() => {
        setNewOrderAlert(null);
    }, []);

    // Setup WebSocket connection and polling
    useEffect(() => {
        if (!restaurantId) return;

        // Initialize WebSocket
        initializeSocket(restaurantId, {
            onConnect: () => {
                setConnected(true);
                loadOrders(); // Refresh on connect
            },
            onDisconnect: () => {
                setConnected(false);
            },
            onNewOrder: (data) => {
                // Add new order to pending list
                const newOrder = data.order;
                setPendingOrders(prev => [newOrder, ...prev]);
                setNewOrderAlert({
                    order: newOrder,
                    message: data.message || 'New order received!'
                });
            },
            onOrderUpdate: (data) => {
                // Update order in lists
                const updatedOrder = data.order;
                setOrders(prev => prev.map(o => 
                    o.orderId === updatedOrder.orderId ? updatedOrder : o
                ));
                setPendingOrders(prev => prev.filter(o => 
                    o.orderId !== updatedOrder.orderId || updatedOrder.status === 'pending_restaurant'
                ));
            },
            onStatusChange: (data) => {
                loadOrders(); // Full refresh on status change
            }
        });

        // Initial load
        loadOrders();

        // Setup polling as fallback (every 30 seconds)
        refreshIntervalRef.current = setInterval(loadOrders, 30000);

        // Cleanup
        return () => {
            disconnectSocket();
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [restaurantId, loadOrders]);

    // Calculate metrics
    const metrics = {
        total: orders.length,
        pending: pendingOrders.length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready_for_pickup').length,
        delivering: orders.filter(o => ['rider_assigned', 'picked_up', 'out_for_delivery'].includes(o.status)).length
    };

    return {
        // Data
        orders,
        pendingOrders,
        allOrders: [...pendingOrders, ...orders.filter(o => o.status !== 'pending_restaurant')],
        metrics,
        
        // State
        loading,
        error,
        connected,
        newOrderAlert,
        
        // Actions
        acceptOrder,
        rejectOrder,
        markReady,
        refresh: loadOrders,
        clearNewOrderAlert,
        
        // Utilities
        getStatusDisplay,
        getTimeSinceOrder
    };
};

export default useUnifiedOrders;
