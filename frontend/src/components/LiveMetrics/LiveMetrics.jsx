import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getTodayMetrics } from '../../services/metricsService';
import styles from './LiveMetrics.module.css';
import { Wallet, ShoppingBag, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function LiveMetrics({ variant = 'default' }) {
    const [metrics, setMetrics] = useState({
        gmv: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        percentChange: { gmv: 0, orders: 0, aov: 0 },
        hourlyTrend: Array(12).fill(0)
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await getTodayMetrics();
                setMetrics(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch live metrics:', err);
                setError(err.message);
                // Keep showing existing data if available
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        // Poll every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    const MetricCard = ({ title, value, change, trendData, color, icon: Icon }) => (
        <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{title}</span>
                <div className={styles.iconBox} style={{ color }}>
                    <Icon size={18} />
                </div>
            </div>

            <div className={styles.mainValue}>{value}</div>

            <div className={styles.footer}>
                <div className={`${styles.badge} ${change >= 0 ? styles.positive : styles.negative}`}>
                    {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{Math.abs(change)}%</span>
                </div>
                <div className={styles.sparkline}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData.map(v => ({ value: v }))}>
                            <defs>
                                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                fill={`url(#gradient-${title})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
    );

    if (error && !metrics.gmv) return (
        <div className={styles.errorContainer}>
            Live Metrics Unavailable (Backend Offline)
        </div>
    );

    return (
        <div className={styles.container}>
            <MetricCard
                title="Today's Sales"
                value={`₹${metrics.gmv?.toLocaleString()}`}
                change={metrics.percentChange?.gmv || 0}
                trendData={metrics.hourlyTrend || []}
                color="#3B82F6"
                icon={Wallet}
            />
            <MetricCard
                title="Total Orders"
                value={metrics.totalOrders}
                change={metrics.percentChange?.orders || 0}
                trendData={metrics.hourlyTrend || []}
                color="#10B981"
                icon={ShoppingBag}
            />
            <MetricCard
                title="Avg Order Value"
                value={`₹${metrics.averageOrderValue}`}
                change={metrics.percentChange?.aov || 0}
                trendData={metrics.hourlyTrend || []}
                color="#F59E0B"
                icon={TrendingUp}
            />
        </div>
    );
}

export default LiveMetrics;
