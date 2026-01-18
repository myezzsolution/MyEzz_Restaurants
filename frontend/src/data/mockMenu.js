import { createMenuItem, CATEGORIES } from '../types/menu';

export const mockMenuItems = [
  // Starters (veg/non-veg specified)
  createMenuItem('1', 'Paneer Tikka', CATEGORIES.STARTERS, 180, true, true),
  createMenuItem('2', 'Chicken 65', CATEGORIES.STARTERS, 220, true, false),
  createMenuItem('3', 'Veg Spring Rolls', CATEGORIES.STARTERS, 150, true, true),
  
  // Mains
  createMenuItem('4', 'Butter Chicken', CATEGORIES.MAINS, 320, true, false),
  createMenuItem('5', 'Dal Makhani', CATEGORIES.MAINS, 240, true, true),
  createMenuItem('6', 'Veggie Pizza (Large)', CATEGORIES.MAINS, 380, true, true),
  createMenuItem('7', 'Chicken Biryani', CATEGORIES.MAINS, 280, true, false),
  
  // Breads (all veg)
  createMenuItem('8', 'Tandoori Roti', CATEGORIES.BREADS, 45, true, true),
  createMenuItem('9', 'Butter Naan', CATEGORIES.BREADS, 55, true, true),
  createMenuItem('10', 'Garlic Naan', CATEGORIES.BREADS, 65, true, true),
  
  // Beverages (all veg)
  createMenuItem('11', 'Mango Lassi', CATEGORIES.BEVERAGES, 80, true, true),
  createMenuItem('12', 'Masala Chai', CATEGORIES.BEVERAGES, 40, true, true),
];