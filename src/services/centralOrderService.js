import axios from 'axios';
import { API_BASE_URL } from '../config';

// Central Backend URL - Single source of truth for all order operations
const CENTRAL_BACKEND_URL = API_BASE_URL;

const centralOrderClient = axios.create({
    baseURL: CENTRAL_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Fetch all active orders (pending, preparing, ready for pickup)
 * Client-side filtering by restaurant name is done in Dashboard.jsx
 * @returns {Promise<Array>} - List of active orders
 */
export const fetchActiveOrders = async () => {
    // Add timestamp to prevent caching
    const response = await centralOrderClient.get(`/api/orders/active?t=${Date.now()}`);
    return response.data;
};

/**
 * Update order status
 * @param {string} orderId - The order's unique ID
 * @param {string} status - New status (preparing, ready, out_for_delivery, delivered, cancelled)
 * @returns {Promise<Object>} - Updated order object
 */
export const updateOrderStatus = async (orderId, status) => {
    const response = await centralOrderClient.patch(`/api/orders/${orderId}/status`, { status });
    return response.data;
};

/**
 * Get a single order by ID
 * @param {string} orderId - The order's unique ID
 * @returns {Promise<Object>} - Order object
 */
export const getOrderById = async (orderId) => {
    const response = await centralOrderClient.get(`/api/orders/${orderId}?t=${Date.now()}`);
    return response.data;
};

export default centralOrderClient;
