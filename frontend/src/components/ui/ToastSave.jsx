import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader } from 'lucide-react';
import styles from './ToastSave.module.css';

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    className={styles.infoIcon}
  >
    <g
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <circle cx="9" cy="9" r="7.25"></circle>
      <line x1="9" y1="12.819" x2="9" y2="8.25"></line>
      <path
        d="M9,6.75c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
        fill="currentColor"
        data-stroke="none"
        stroke="none"
      ></path>
    </g>
  </svg>
);

const springConfig = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
};

function ToastSave({
  state = "initial",
  onReset,
  onSave,
  loadingText = "Saving",
  successText = "Changes Saved",
  initialText = "Unsaved changes",
  resetText = "Reset",
  saveText = "Save",
  className = "",
}) {
  return (
    <motion.div
      className={`${styles.toastSave} ${className}`}
      initial={false}
      animate={{ width: "auto" }}
      transition={springConfig}
    >
      <div className={styles.toastContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            className={styles.stateContent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
          >
            {state === "loading" && (
              <>
                <Loader className={styles.spinnerIcon} size={18} />
                <div className={styles.stateText}>{loadingText}</div>
              </>
            )}
            {state === "success" && (
              <>
                <div className={styles.successIconWrapper}>
                  <Check className={styles.checkIcon} size={14} />
                </div>
                <div className={styles.stateText}>{successText}</div>
              </>
            )}
            {state === "initial" && (
              <>
                <div className={styles.infoIconWrapper}>
                  <InfoIcon />
                </div>
                <div className={styles.stateText}>{initialText}</div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {state === "initial" && (
            <motion.div
              className={styles.buttonGroup}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ ...springConfig, opacity: { duration: 0 } }}
            >
              <button
                onClick={onReset}
                className={styles.resetBtn}
              >
                {resetText}
              </button>
              <button
                onClick={onSave}
                className={styles.saveBtn}
              >
                {saveText}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default ToastSave;
