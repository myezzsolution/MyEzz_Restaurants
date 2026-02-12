import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import useKeyboard from '../../hooks/useKeyboard';
import styles from './PrepTimeModal.module.css';

const PrepTimeModal = ({ isOpen, onClose, onConfirm, orderDetails }) => {
  const [selectedTime, setSelectedTime] = useState(15);

  const prepTimeOptions = [
    { value: 15, label: '15 minutes', description: 'Quick items' },
    { value: 30, label: '30 minutes', description: 'Standard prep' },
    { value: 45, label: '45 minutes', description: 'Complex orders' }
  ];

  const handleConfirm = () => {
    onConfirm(selectedTime);
    onClose();
    setSelectedTime(15); // Reset for next time
  };

  useKeyboard({
    onEscape: onClose,
    onEnter: handleConfirm
  }, [selectedTime], isOpen);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Clock size={20} />
            Select Preparation Time
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {orderDetails && (
          <div className={styles.orderSummary}>
            <h3>Order #{orderDetails.id}</h3>
            <p>{orderDetails.customerName}</p>
            <div className={styles.itemsList}>
              {orderDetails.items.map((item, index) => (
                <span key={index} className={styles.item}>
                  {item.quantity}x {item.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.timeOptions}>
          {prepTimeOptions.map((option) => (
            <label key={option.value} className={styles.timeOption}>
              <input
                type="radio"
                name="prepTime"
                value={option.value}
                checked={selectedTime === option.value}
                onChange={(e) => setSelectedTime(Number(e.target.value))}
                className={styles.radioInput}
              />
              <div className={styles.optionContent}>
                <div className={styles.timeLabel}>{option.label}</div>
                <div className={styles.timeDescription}>{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            Start Preparing
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrepTimeModal;