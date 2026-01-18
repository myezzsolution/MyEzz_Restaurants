import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, BarChart3, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import SettingsPanel from './SettingsPanel';
import styles from './Navbar.module.css';

const Navbar = () => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/orders',
      name: 'Orders',
      icon: Home,
      ariaLabel: 'Navigate to Orders'
    },
    {
      path: '/history',
      name: 'History',
      icon: Clock,
      ariaLabel: 'View Order History'
    },
    {
      path: '/menu',
      name: 'Menu',
      icon: UtensilsCrossed,
      ariaLabel: 'Navigate to Menu'
    },
    {
      path: '/report',
      name: 'Dashboard', // Changed from Report to Dashboard
      icon: BarChart3,
      ariaLabel: 'Navigate to Dashboard'
    }
  ];

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <ul className={styles.navList}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li key={item.path} className={styles.navItem}>
              <Link
                to={item.path}
                className={`${styles.navLink} ${
                  location.pathname === item.path ? styles.active : ''
                }`}
                aria-label={item.ariaLabel}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="activeTab"
                    className={styles.activeBackground}
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                <span className={styles.iconContainer}>
                  <IconComponent 
                    className={styles.navIcon} 
                    size={20}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.navText}>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      
      <SettingsPanel />
    </nav>
  );
};

export default Navbar;