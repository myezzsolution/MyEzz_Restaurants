import { useRestaurant } from '../../context/RestaurantContext';
import styles from './Header.module.css';

const Header = () => {
  const { restaurantName, isOnline, setOnlineStatus } = useRestaurant();

  const handleToggle = () => {
    setOnlineStatus(!isOnline);
  };

  return (
    <header className={styles.header}>
      <div className={styles.restaurantName}>
        {restaurantName}
      </div>
      <div className={styles.toggleContainer}>
        <span className={styles.statusLabel}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <button
          className={`${styles.toggle} ${isOnline ? styles.online : styles.offline}`}
          onClick={handleToggle}
          aria-label={`Toggle restaurant ${isOnline ? 'offline' : 'online'}`}
        >
          <div className={styles.toggleSlider}></div>
        </button>
      </div>
    </header>
  );
};

export default Header;