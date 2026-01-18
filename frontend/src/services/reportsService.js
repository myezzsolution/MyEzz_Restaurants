/**
 * Reports Service
 * Handles all data fetching for the Reports & Analytics page via Backend API.
 */

import axios from 'axios';
import { config } from '../config';

const api = axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
});

export const reportsService = {
    /**
     * Fetch Sales Chart Data
     * @param {string} range - 'today', 'yesterday', '7days', '30days'
     */
    async fetchSalesData(range = '7days') {
        try {
            const response = await api.get(`/api/reports/sales?range=${range}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching sales data:', error);
            return [];
        }
    },

    /**
     * Fetch Order Funnel Statistics
     * @param {string} range - 'today', 'yesterday', '7days', '30days'
     */
    async fetchOrderStats(range = '7days') {
        try {
            const response = await api.get(`/api/reports/orders?range=${range}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching order stats:', error);
            return null;
        }
    },

    /**
     * Fetch Menu Performance (Top Selling Items)
     * @param {string} range - 'today', 'yesterday', '7days', '30days'
     */
    async fetchMenuPerformance(range = '7days') {
        try {
            const response = await api.get(`/api/reports/menu?range=${range}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching menu performance:', error);
            return null;
        }
    },

    /**
     * Fetch Busy Hours (Heatmap)
     * @param {string} range - 'today', 'yesterday', '7days', '30days'
     */
    async fetchBusyHours(range = '7days') {
        try {
            const response = await api.get(`/api/reports/heatmap?range=${range}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching heatmap data:', error);
            return [];
        }
    },

    /**
     * Fetch Customer Insights
     * @param {string} range - 'today', 'yesterday', '7days', '30days'
     */
    async fetchCustomerInsights(range = '7days') {
        try {
            const response = await api.get(`/api/reports/customers?range=${range}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching customer insights:', error);
            return null;
        }
    },

    /**
     * Fetch Auto-generated Insights
     */
    async fetchAutoInsights() {
        try {
            const response = await api.get('/api/reports/insights');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching text insights:', error);
            return [];
        }
    }
};

export default reportsService;
