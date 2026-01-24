import { useState } from 'react';
import styles from './FilterBar.module.css';
import { Calendar, Download, X } from 'lucide-react';

function FilterBar({ timeRange, setTimeRange, onExport }) {
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const ranges = [
        { id: 'today', label: 'Today' },
        { id: 'yesterday', label: 'Yesterday' },
        { id: '7days', label: 'Last 7 Days' },
        { id: '30days', label: 'Last 30 Days' },
    ];

    const handleCustomSubmit = () => {
        if (customStart && customEnd) {
            setTimeRange({ type: 'custom', start: customStart, end: customEnd });
            setShowCustomDate(false);
        }
    };

    const isCustomActive = typeof timeRange === 'object' && timeRange.type === 'custom';

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
                {showCustomDate ? (
                    <div className={styles.customDatePopup} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                        <input 
                            type="date" 
                            className={styles.dateInput}
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            style={{ background: 'transparent', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '4px' }}
                        />
                        <span style={{ color: '#888' }}>to</span>
                        <input 
                            type="date" 
                            className={styles.dateInput}
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            style={{ background: 'transparent', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: '4px' }}
                        />
                        <button onClick={handleCustomSubmit} style={{ background: '#FF6600', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', cursor: 'pointer' }}>Go</button>
                         <button onClick={() => setShowCustomDate(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex' }}><X size={16}/></button>
                    </div>
                ) : (
                    <button 
                        className={`${styles.actionBtn} ${isCustomActive ? styles.active : ''}`}
                        onClick={() => setShowCustomDate(true)}
                    >
                        <Calendar size={18} />
                        <span>{isCustomActive ? `${timeRange.start} - ${timeRange.end}` : 'Custom Date'}</span>
                    </button>
                )}

                <button 
                    className={`${styles.actionBtn} ${styles.exportBtn}`}
                    onClick={onExport}
                >
                    <Download size={18} />
                    <span>Export</span>
                </button>
            </div>
        </div>
    );
}

export default FilterBar;
