import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import styles from './SuccessToast.module.css';

const SuccessToast = ({ 
  message = "Your settings have been saved", 
  duration = 3000, 
  onClose,
  isVisible = true 
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 300); // Wait for fade-out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !show) return null;

  return (
    <div className={`${styles.toast} ${show ? styles.visible : styles.hidden}`}>
      <Check size={20} strokeWidth={3} className={styles.icon} />
      <span className={styles.message}>{message}</span>
    </div>
  );
};

export default SuccessToast;
