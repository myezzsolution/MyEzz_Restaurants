import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import styles from './TimeHeatmap.module.css';

function TimeHeatmap({ data }) {
    if (!data || data.length === 0) return <div className={styles.noData}>No data available</div>;

    // Determine color based on value (intensity)
    const getColor = (value) => {
        if (value >= 80) return '#EF4444'; // Red (Hot)
        if (value >= 50) return '#F59E0B'; // Amber (Warm)
        return '#3B82F6'; // Blue (Normal)
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.tooltip}>
                    <p className={styles.label}>{label}</p>
                    <p className={styles.value}>
                        Traffic Level: <strong>{payload[0].value}%</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        interval={0}
                        dy={5}
                    />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TimeHeatmap;
