import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import styles from './SuccessToast.module.css'; // Reusing styles for consistency, will override colors inline or with new class

const WarningToast = ({ 
  message = "Warning", 
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
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !show) return null;

  return createPortal(
    <div 
      className={`${styles.toast} ${show ? styles.visible : styles.hidden}`}
      style={{ background: '#FF3B30', boxShadow: '0 10px 40px rgba(255, 59, 48, 0.3)' }}
    >
      <AlertCircle size={20} strokeWidth={2.5} className={styles.icon} />
      <span className={styles.message}>{message}</span>
    </div>,
    document.body
  );
};

export default WarningToast;
