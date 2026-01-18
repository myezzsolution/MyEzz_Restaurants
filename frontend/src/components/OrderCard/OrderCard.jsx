import { useState, useEffect } from 'react';
import { Clock, CheckCircle, User, Check } from 'lucide-react';
import styles from './OrderCard.module.css';

const OrderCard = ({ order, onAccept, onReject, onMarkReady, onHandToRider }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [checkedItems, setCheckedItems] = useState(new Set());

  useEffect(() => {
    if (order.status === 'preparing' && order.prepTime && order.acceptedAt) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(order.acceptedAt).getTime();
        const endTime = startTime + (order.prepTime * 60 * 1000);
        const elapsed = now - startTime;
        const remaining = Math.max(0, endTime - now);
        
        setElapsedTime(elapsed);
        setTimeRemaining(remaining);
      }, 1000);

      return () => clearInterval(timer);
    } else if (order.status === 'new') {
      // For new orders, show elapsed time since order was placed
      const timer = setInterval(() => {
        const now = new Date().getTime();
        // Simulate order creation time (5 minutes ago for demo)
        const orderTime = now - (5 * 60 * 1000);
        const elapsed = now - orderTime;
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [order.status, order.prepTime, order.acceptedAt]);

  const formatElapsedTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    if (minutes < 1) return 'Just now';
    return `${minutes}m ago`;
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCardClass = () => {
    switch (order.status) {
      case 'new':
        return styles.newOrder;
      case 'preparing':
        return styles.preparing;
      case 'ready':
        return styles.ready;
      default:
        return '';
    }
  };

  // Check if order is delayed (over 15 minutes in preparing)
  const isDelayed = order.status === 'preparing' && elapsedTime > 15 * 60 * 1000;

  const toggleItemCheck = (index) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  return (
    <div className={`${styles.orderCard} ${getCardClass()}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.orderId}>#{order.id}</h3>
        
        {/* Timer in Top-Right Corner */}
        {(order.status === 'new' || order.status === 'preparing') && (
          <div className={`${styles.timer} ${isDelayed ? styles.timerDelayed : ''}`}>
            <Clock size={16} />
            <span>
              {order.status === 'preparing' && timeRemaining !== null 
                ? formatTime(timeRemaining)
                : formatElapsedTime(elapsedTime)
              }
            </span>
          </div>
        )}
        
        <span className={styles.statusBadge}>
          {order.status === 'new' && 'New Order'}
          {order.status === 'preparing' && 'Preparing'}
          {order.status === 'ready' && 'Ready'}
        </span>
      </div>

      {/* Muted Customer Name */}
      <div className={styles.customerInfo}>
        <User size={16} />
        <span className={styles.customerName}>{order.customerName}</span>
      </div>

      {/* Enhanced Order Items with Checkboxes */}
      <div className={styles.orderItems}>
        {order.items.map((item, index) => (
          <div 
            key={index} 
            className={`${styles.orderItem} ${checkedItems.has(index) ? styles.itemChecked : ''}`}
          >
            {order.status === 'preparing' && (
              <button
                className={`${styles.itemCheckbox} ${checkedItems.has(index) ? styles.checked : ''}`}
                onClick={() => toggleItemCheck(index)}
                aria-label={`Mark ${item.name} as prepared`}
              >
                {checkedItems.has(index) && <Check size={12} />}
              </button>
            )}
            <span className={styles.quantity}>{item.quantity}x</span>
            <span className={`${styles.itemName} ${checkedItems.has(index) ? styles.strikethrough : ''}`}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.orderTotal}>
        Total: <strong>₹{order.total.toFixed(2)}</strong>
      </div>

      {order.status === 'ready' && (
        <div className={styles.verificationCode}>
          <div className={styles.codeLabel}>Verification Code</div>
          <div className={styles.code}>{order.verificationCode}</div>
        </div>
      )}

      <div className={styles.cardActions}>
        {order.status === 'new' && (
          <>
            <button 
              className={styles.acceptBtn}
              onClick={() => onAccept(order.id)}
            >
              Accept
            </button>
            <button 
              className={styles.rejectBtn}
              onClick={() => onReject(order.id)}
            >
              Reject
            </button>
          </>
        )}

        {order.status === 'preparing' && (
          <button 
            className={styles.markReadyBtn}
            onClick={() => onMarkReady(order.id)}
          >
            <CheckCircle size={16} />
            Mark Ready
          </button>
        )}

        {order.status === 'ready' && (
          <button 
            className={styles.handToRiderBtn}
            onClick={() => onHandToRider(order.id)}
          >
            Handed to Rider
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;