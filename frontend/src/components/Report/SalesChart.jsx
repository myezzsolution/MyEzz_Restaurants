import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import styles from './SalesChart.module.css';

function SalesChart({ data, timeRange }) {
    if (!data || data.length === 0) return <div className={styles.noData}>No sales data available</div>;

    const isHourly = timeRange === 'today' || timeRange === 'yesterday';

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.tooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    <div className={styles.tooltipItem}>
                        <span className={styles.dot} style={{ background: '#3B82F6' }}></span>
                        <p className={styles.tooltipText}>
                            Sales: <strong>₹{payload.find(p => p.dataKey === 'sales')?.value.toLocaleString()}</strong>
                        </p>
                    </div>
                    <div className={styles.tooltipItem}>
                        <span className={styles.dot} style={{ background: '#10B981' }}></span>
                        <p className={styles.tooltipText}>
                            Orders: <strong>{payload.find(p => p.dataKey === 'orders')?.value}</strong>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey={isHourly ? 'time' : 'date'}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        dy={10}
                        interval={isHourly ? 2 : 0}
                    />
                    {/* Primary Axis: Sales (Left) */}
                    <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    />
                    {/* Secondary Axis: Orders (Right) */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                    <Bar
                        yAxisId="right"
                        dataKey="orders"
                        barSize={20}
                        fill="#10B981"
                        opacity={0.3}
                        radius={[4, 4, 0, 0]}
                        name="Order Count"
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#3B82F6' }}
                        activeDot={{ r: 6, strokeWidth: 2, fill: '#3B82F6', stroke: 'white' }}
                        name="Revenue (₹)"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SalesChart;
