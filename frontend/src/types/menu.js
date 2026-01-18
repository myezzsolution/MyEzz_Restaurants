/**
 * MenuItem Interface
 * Simple flat structure without nested variants
 */

export const createMenuItem = (id, name, category, price, inStock = true, isVeg = true) => ({
  id,
  name,
  category,
  price,
  inStock,
  isVeg
});

// Category constants
export const CATEGORIES = {
  ALL: 'All',
  STARTERS: 'Starters',
  MAINS: 'Mains',
  BREADS: 'Breads',
  BEVERAGES: 'Beverages',
  DESSERTS: 'Desserts'
};

// Status tabs
export const STATUS_TABS = {
  ALL: 'all',
  IN_STOCK: 'inStock',
  OUT_OF_STOCK: 'outOfStock'
};