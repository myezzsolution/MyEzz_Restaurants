import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import styles from './OrderNotificationToast.module.css';

function OrderNotificationToast({ order, onClose, restaurantId }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-dismiss after 10 seconds if not interacted with
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!order) return null;

  const handleViewOrder = () => {
    navigate(`/${restaurantId}/orders`);
    onClose();
  };

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsText = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

  return (
    <div className={styles.toast}>
      <div className={styles.iconContainer}>
        <Bell size={24} className={styles.bellIcon} />
        <div className={styles.ping}></div>
      </div>
      
      <div className={styles.content}>
        <h4 className={styles.title}>New Order from {order.customerName}</h4>
        <p className={styles.items} title={itemsText}>
          {itemCount} Items: {itemsText}
        </p>
      </div>

      <div className={styles.actions}>
        <button className={styles.viewBtn} onClick={handleViewOrder}>
          View
        </button>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default OrderNotificationToast;
