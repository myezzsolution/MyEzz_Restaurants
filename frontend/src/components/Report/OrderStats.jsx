import styles from './OrderStats.module.css';

function OrderStats({ stats }) {
    if (!stats) return <div className={styles.noData}>No data available</div>;

    const items = [
        { label: 'Received', value: stats.received, color: '#3B82F6' },
        { label: 'Accepted', value: stats.accepted, color: '#10B981' },
        { label: 'Rejected', value: stats.rejected, color: '#EF4444' },
        { label: 'Cancelled', value: stats.cancelled, color: '#F59E0B' },
    ];

    const maxVal = Math.max(...items.map(i => i.value));

    return (
        <div className={styles.container}>
            {items.map((item) => (
                <div key={item.label} className={styles.item}>
                    <div className={styles.header}>
                        <span className={styles.label}>{item.label}</span>
                        <span className={styles.value}>{item.value}</span>
                    </div>
                    <div className={styles.progressBg}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${(item.value / maxVal) * 100}%`,
                                backgroundColor: item.color
                            }}
                        />
                    </div>
                </div>
            ))}
            <div className={styles.divider} />
            <div className={styles.meta}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Completion Rate</span>
                    <span className={styles.metaValue} style={{ color: '#10B981' }}>{stats.completionRate}%</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Avg Prep Time</span>
                    <span className={styles.metaValue}>{stats.avgPrepTime}</span>
                </div>
            </div>
        </div>
    );
}

export default OrderStats;
