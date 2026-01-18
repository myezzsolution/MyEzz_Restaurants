import styles from './CustomerInsights.module.css';
import { Users, UserPlus, Repeat, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

function CustomerInsights({ data }) {
    if (!data) return null;

    const chartData = [
        { name: 'New', value: data.newCustomers, color: '#3B82F6' },
        { name: 'Returning', value: data.returningCustomers, color: '#8B5CF6' },
    ];

    const items = [
        { icon: UserPlus, label: 'New', value: data.newCustomers, color: '#3B82F6' },
        { icon: Users, label: 'Returning', value: data.returningCustomers, color: '#8B5CF6' },
        { icon: Repeat, label: 'Repeat Rate', value: `${data.repeatRate}%`, color: '#10B981' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.chartSection}>
                <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontSize: '12px', color: '#1E293B', fontWeight: 600 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Centered Label */}
                <div className={styles.chartLabel}>
                    <span className={styles.totalUsers}>{data.newCustomers + data.returningCustomers}</span>
                    <span className={styles.totalLabel}>Total</span>
                </div>
            </div>

            <div className={styles.grid}>
                {items.map((item) => (
                    <div key={item.label} className={styles.statRow}>
                        <div className={styles.rowLabel}>
                            <div className={styles.dot} style={{ background: item.color }} />
                            <span>{item.label}</span>
                        </div>
                        <span className={styles.rowValue}>{item.value}</span>
                    </div>
                ))}
                <div className={styles.divider} />
                <div className={styles.avgOrderStat}>
                    <span className={styles.avgLabel}>Avg Orders / User</span>
                    <span className={styles.avgValue}>{data.avgOrdersPerCustomer}</span>
                </div>
            </div>
        </div>
    );
}

export default CustomerInsights;
