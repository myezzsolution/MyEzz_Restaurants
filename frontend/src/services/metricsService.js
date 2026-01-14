import axios from 'axios';
import { config } from '../config';

const api = axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Fetch today's metrics from the backend
 * @returns {Promise<{gmv: number, totalOrders: number, averageOrderValue: number}>}
 */
export async function getTodayMetrics() {
    try {
        const response = await api.get('/api/metrics/today');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching metrics:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch metrics');
    }
}

/**
 * Create a new order (for testing)
 */
export async function createOrder(orderData) {
    try {
        const response = await api.post('/api/orders', orderData);
        return response.data.data;
    } catch (error) {
        console.error('Error creating order:', error);
        throw new Error(error.response?.data?.message || 'Failed to create order');
    }
}

export default {
    getTodayMetrics,
    createOrder,
};
