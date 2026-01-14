// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const config = {
    apiUrl: API_BASE_URL,
    metricsRefreshInterval: 30000, // 30 seconds
};
