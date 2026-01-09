import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, BarChart3 } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = () => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: Home,
      ariaLabel: 'Navigate to Dashboard'
    },
    {
      path: '/menu',
      name: 'Menu',
      icon: UtensilsCrossed,
      ariaLabel: 'Navigate to Menu'
    },
    {
      path: '/report',
      name: 'Report',
      icon: BarChart3,
      ariaLabel: 'Navigate to Report'
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
                <IconComponent 
                  className={styles.navIcon} 
                  size={20}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className={styles.navText}>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;