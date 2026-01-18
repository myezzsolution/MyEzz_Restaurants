import styles from './ReportCard.module.css';

function ReportCard({ title, children, className }) {
    return (
        <div className={`${styles.card} ${className || ''}`}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
}

export default ReportCard;
