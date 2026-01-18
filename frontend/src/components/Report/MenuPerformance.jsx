import styles from './MenuPerformance.module.css';

function MenuPerformance({ data }) {
    if (!data || !data.topItems) return <div className={styles.noData}>No menu data</div>;

    return (
        <div className={styles.container}>
            <div className={styles.list}>
                {data.topItems.slice(0, 5).map((item, index) => (
                    <div key={item.name} className={styles.row}>
                        <div className={styles.progressFill} style={{ width: `${(item.revenue / data.topItems[0].revenue) * 100}%` }} />
                        <div className={styles.content}>
                            <div className={styles.rank}>#{index + 1}</div>
                            <div className={styles.info}>
                                <p className={styles.name}>{item.name}</p>
                                <p className={styles.subtext}>{item.orders} orders</p>
                            </div>
                            <div className={styles.revenue}>
                                ₹{item.revenue.toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MenuPerformance;
