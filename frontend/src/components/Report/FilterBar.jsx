import styles from './FilterBar.module.css';
import { Calendar, Download } from 'lucide-react';

function FilterBar({ timeRange, setTimeRange }) {
    const ranges = [
        { id: 'today', label: 'Today' },
        { id: 'yesterday', label: 'Yesterday' },
        { id: '7days', label: 'Last 7 Days' },
        { id: '30days', label: 'Last 30 Days' },
    ];

    return (
        <div className={styles.filterBar}>
            <div className={styles.rangeSelector}>
                {ranges.map((range) => (
                    <button
                        key={range.id}
                        className={`${styles.filterBtn} ${timeRange === range.id ? styles.active : ''}`}
                        onClick={() => setTimeRange(range.id)}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            <div className={styles.actions}>
                <button className={styles.actionBtn}>
                    <Calendar size={18} />
                    <span>Custom Date</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.exportBtn}`}>
                    <Download size={18} />
                    <span>Export</span>
                </button>
            </div>
        </div>
    );
}

export default FilterBar;
