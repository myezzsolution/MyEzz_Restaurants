import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, User, Check, Eye, EyeOff, MoreVertical } from 'lucide-react';
import styles from './OrderCard.module.css';

const OrderCard = ({ order, onAccept, onReject, onMarkReady, onHandToRider, onValidationFail }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    }
  }, [order.status, order.prepTime, order.acceptedAt]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

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

  const handleMarkReady = () => {
     if (checkedItems.size !== order.items.length) {
       if (onValidationFail) onValidationFail();
       return;
     }
     onMarkReady(order.id);
  };

  return (
    <div className={`${styles.orderCard} ${getCardClass()}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.orderId}>#{order.id}</h3>
        
        {/* Timer — only for preparing orders */}
        {order.status === 'preparing' && timeRemaining !== null && (
          <div className={`${styles.timer} ${isDelayed ? styles.timerDelayed : ''}`}>
            <Clock size={16} />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}

        <div className={styles.headerRight}>
          <span className={styles.statusBadge}>
            {order.status === 'new' && 'New Order'}
            {order.status === 'preparing' && 'Preparing'}
            {order.status === 'ready' && 'Ready'}
          </span>

          {/* Three-dot menu */}
          {order.status === 'new' && onReject && (
            <div className={styles.moreMenu} ref={menuRef}>
              <button
                className={styles.moreMenuBtn}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="More options"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <div className={styles.menuDropdown}>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      onReject(order.id);
                    }}
                  >
                    Reject Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Muted Customer Name */}
      <div className={styles.customerInfo}>
        <User size={16} />
        <span className={styles.customerName}>{order.customerName}</span>
      </div>

      {/* Order Items with Checkboxes */}
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
          <div className={styles.codeRow}>
            <div className={styles.code}>
              {codeRevealed ? order.verificationCode : '••••'}
            </div>
            <button
              className={styles.codeToggle}
              onClick={() => setCodeRevealed(!codeRevealed)}
              aria-label={codeRevealed ? 'Hide code' : 'Reveal code'}
            >
              {codeRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      )}

      <div className={styles.cardActions}>
        {order.status === 'new' && (
          <button 
            className={styles.acceptBtn}
            onClick={() => onAccept(order.id)}
          >
            Accept
          </button>
        )}

        {order.status === 'preparing' && (
          <button 
            className={styles.markReadyBtn}
            onClick={handleMarkReady}
            title="Mark order as ready"
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