import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import MenuItemCard from '../../components/MenuItemCard/MenuItemCard';
import AddItemModal from '../../components/AddItemModal/AddItemModal';
import SuccessToast from '../../components/ui/SuccessToast';
import { mockMenuItems } from '../../data/mockMenu';
import { CATEGORIES, STATUS_TABS } from '../../types/menu';
import styles from './Menu.module.css';

function Menu() {
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.ALL);
  const [activeTab, setActiveTab] = useState(STATUS_TABS.ALL);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  // Get all unique categories
  const categories = [
    CATEGORIES.ALL,
    ...Object.values(CATEGORIES).filter(cat => cat !== CATEGORIES.ALL)
  ];

  // Filter items based on search, category, and status
  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by search query
    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== CATEGORIES.ALL) {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filter by status tab
    if (activeTab === STATUS_TABS.IN_STOCK) {
      items = items.filter(item => item.inStock);
    } else if (activeTab === STATUS_TABS.OUT_OF_STOCK) {
      items = items.filter(item => !item.inStock);
    }

    return items;
  }, [menuItems, searchQuery, selectedCategory, activeTab]);

  // Count items
  const inStockCount = menuItems.filter(item => item.inStock).length;
  const outOfStockCount = menuItems.filter(item => !item.inStock).length;

  // Handle toggle stock status
  const handleToggleStock = (itemId) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, inStock: !item.inStock } : item
      )
    );
  };

  // Handle add new item
  const handleAddItem = (newItemData) => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemData.name,
      category: newItemData.category,
      price: newItemData.price,
      isVeg: newItemData.isVeg,
      inStock: true
    };

    setMenuItems(prevItems => [...prevItems, newItem]);
    setIsAddModalOpen(false);
    setToast({ isVisible: true, message: `"${newItemData.name}" added to menu!` });
  };

  // Handle delete item
  const handleDeleteItem = (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    setMenuItems(prevItems => prevItems.filter(i => i.id !== itemId));
    setToast({ isVisible: true, message: `"${item?.name}" removed from menu` });
  };

  const closeToast = () => {
    setToast({ isVisible: false, message: '' });
  };

  return (
    <div className={styles.menu}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Menu & Inventory</h1>
            <p className={styles.subtitle}>Manage your menu items and stock availability</p>
          </div>
          <button 
            className={styles.addButton}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={20} />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Category Pills */}
      <div className={styles.categoryContainer}>
        <div className={styles.categoryScroll}>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.categoryPill} ${selectedCategory === category ? styles.categoryActive : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Status Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === STATUS_TABS.ALL ? styles.tabActive : ''}`}
          onClick={() => setActiveTab(STATUS_TABS.ALL)}
        >
          All Items
          <span className={styles.tabCount}>{menuItems.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === STATUS_TABS.IN_STOCK ? styles.tabActive : ''}`}
          onClick={() => setActiveTab(STATUS_TABS.IN_STOCK)}
        >
          In Stock
          <span className={`${styles.tabCount} ${styles.tabCountSuccess}`}>
            {inStockCount}
          </span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === STATUS_TABS.OUT_OF_STOCK ? styles.tabActive : ''}`}
          onClick={() => setActiveTab(STATUS_TABS.OUT_OF_STOCK)}
        >
          Out of Stock
          <span className={`${styles.tabCount} ${styles.tabCountDanger}`}>
            {outOfStockCount}
          </span>
        </button>
      </div>

      {/* Items List */}
      <div className={styles.itemsList}>
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onToggleStock={handleToggleStock}
              onDelete={handleDeleteItem}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No items found</p>
            <p className={styles.emptySubtext}>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'No items match the selected filters'}
            </p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
      />

      {/* Success Toast Notification */}
      {toast.isVisible && (
        <SuccessToast
          message={toast.message}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

export default Menu;