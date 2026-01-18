import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '../../context/RestaurantContext';
import { Settings, User, Moon, Sun } from 'lucide-react';
import styles from './SettingsPanel.module.css';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const { toggleProfile } = useRestaurant();
  const panelRef = useRef(null);
  // const navigate = useNavigate(); // Removed as per instruction to use toggleProfile

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.settingsContainer} ref={panelRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.popover}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Profile Option */}
            <button 
              className={styles.popoverItem} 
              onClick={() => {
                toggleProfile(true); // Changed from navigate('/profile')
                setIsOpen(false);
              }}
            >
              <User size={18} strokeWidth={1.5} />
              <span>Profile</span>
            </button>
            
            <div className={styles.divider} />
            
            {/* Theme Toggle Row */}
            <div className={styles.themeRow}>
              <div className={styles.themeLabel}>
                {theme === 'dark' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <button 
                className={`${styles.toggleSwitch} ${theme === 'light' ? styles.toggleActive : ''}`}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                <div className={styles.toggleKnob} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button 
        className={`${styles.settingsButton} ${isOpen ? styles.settingsButtonActive : ''}`}
        onClick={togglePanel}
        aria-label="Settings"
      >
        <Settings size={22} strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default SettingsPanel;
