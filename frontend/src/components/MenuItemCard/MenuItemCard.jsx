import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import styles from './MenuItemCard.module.css';

const MenuItemCard = ({ item, onToggleStock, onDelete }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    onToggleStock(item.id);
    setIsToggling(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      onDelete(item.id);
    }
  };

  return (
    <div className={`${styles.card} ${!item.inStock ? styles.outOfStock : ''}`}>
      <div className={styles.itemInfo}>
        <div className={styles.nameRow}>
          {/* Veg/Non-Veg Badge */}
          <span className={`${styles.vegBadge} ${item.isVeg ? styles.veg : styles.nonVeg}`}>
            <span className={styles.vegDot}></span>
          </span>
          <h3 className={styles.itemName}>{item.name}</h3>
        </div>
        <div className={styles.itemDetails}>
          <span className={styles.price}>₹{item.price}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.category}>{item.category}</span>
        </div>
      </div>
      
      <div className={styles.toggleSection}>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 size={18} />
        </button>
        <button
          className={`${styles.toggle} ${item.inStock ? styles.toggleOn : styles.toggleOff} ${isToggling ? styles.toggling : ''}`}
          onClick={handleToggle}
          disabled={isToggling}
          aria-label={`Toggle ${item.name} stock status`}
        >
          <div className={styles.toggleSlider}></div>
        </button>
        <span className={`${styles.statusLabel} ${item.inStock ? styles.inStock : styles.outStock}`}>
          {item.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
    </div>
  );
};

export default MenuItemCard;