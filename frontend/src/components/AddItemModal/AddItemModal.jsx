import { useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES } from '../../types/menu';
import styles from './AddItemModal.module.css';

function AddItemModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES.MAINS,
    price: '',
    isVeg: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price) {
      return;
    }

    onAdd({
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price),
      isVeg: formData.isVeg
    });

    // Reset form
    setFormData({
      name: '',
      category: CATEGORIES.MAINS,
      price: '',
      isVeg: true
    });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' ? value === 'true' : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add New Item</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Item Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g., Butter Chicken"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category" className={styles.label}>
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value={CATEGORIES.STARTERS}>Starters</option>
              <option value={CATEGORIES.MAINS}>Mains</option>
              <option value={CATEGORIES.BREADS}>Breads</option>
              <option value={CATEGORIES.BEVERAGES}>Beverages</option>
            </select>
          </div>

          {/* Veg/Non-Veg Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Food Type</label>
            <div className={styles.vegToggle}>
              <label className={`${styles.vegOption} ${formData.isVeg ? styles.vegSelected : ''}`}>
                <input
                  type="radio"
                  name="isVeg"
                  value="true"
                  checked={formData.isVeg === true}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <span className={styles.vegIndicator}>
                  <span className={styles.vegDot}></span>
                </span>
                <span>Veg</span>
              </label>
              <label className={`${styles.vegOption} ${!formData.isVeg ? styles.nonVegSelected : ''}`}>
                <input
                  type="radio"
                  name="isVeg"
                  value="false"
                  checked={formData.isVeg === false}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <span className={styles.nonVegIndicator}>
                  <span className={styles.nonVegDot}></span>
                </span>
                <span>Non-Veg</span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Price (₹)
            </label>
            <div className={styles.priceInputWrapper}>
              <span className={styles.priceSymbol}>₹</span>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`${styles.input} ${styles.priceInput}`}
                placeholder="250"
                min="0"
                step="10"
                required
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
            >
              Add to Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddItemModal;
