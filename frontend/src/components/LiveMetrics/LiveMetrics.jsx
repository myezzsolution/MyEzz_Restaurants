import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { getTodayMetrics } from '../../services/metricsService';
import { config } from '../../config';
import styles from './LiveMetrics.module.css';

function LiveMetrics() {
    const [metrics, setMetrics] = useState({
        gmv: 0,
        totalOrders: 0,
        averageOrderValue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMetrics = async () => {
        try {
            setError(null);
            const data = await getTodayMetrics();
            setMetrics(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchMetrics();

        // Set up auto-refresh
        const interval = setInterval(fetchMetrics, config.metricsRefreshInterval);

        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const metricCards = [
        {
            id: 'gmv',
            title: "Today's Sales (GMV)",
            value: formatCurrency(metrics.gmv),
            icon: DollarSign,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#667eea',
        },
        {
            id: 'orders',
            title: 'Total Orders',
            value: metrics.totalOrders,
            icon: ShoppingCart,
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#f093fb',
        },
        {
            id: 'aov',
            title: 'Average Order Value',
            value: formatCurrency(metrics.averageOrderValue),
            icon: TrendingUp,
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: '#4facfe',
        },
    ];

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>⚠️ {error}</p>
                <button onClick={fetchMetrics} className={styles.retryButton}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={styles.metricsContainer}>
            <div className={styles.metricsGrid}>
                {metricCards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        className={styles.metricCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                                <div
                                    className={styles.iconWrapper}
                                    style={{ background: card.gradient }}
                                >
                                    <card.icon className={styles.icon} />
                                </div>
                                <h3 className={styles.cardTitle}>{card.title}</h3>
                            </div>
                            <div className={styles.cardValue}>
                                {loading ? (
                                    <div className={styles.skeleton}></div>
                                ) : (
                                    <motion.span
                                        key={card.value}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {card.value}
                                    </motion.span>
                                )}
                            </div>
                        </div>
                        <div
                            className={styles.cardGlow}
                            style={{ background: card.gradient }}
                        ></div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default LiveMetrics;
