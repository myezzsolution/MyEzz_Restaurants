import { createContext, useContext, useState } from 'react';

const RestaurantContext = createContext();

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children }) => {
  const [restaurantName] = useState('Demo Restaurant'); // Default name for MVP
  const [isOnline, setIsOnline] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const setOnlineStatus = (status) => {
    setIsOnline(status);
  };

  const toggleProfile = (isOpen) => {
    setIsProfileOpen(isOpen);
  };

  const value = {
    restaurantName,
    isOnline,
    restaurantName,
    isOnline,
    setOnlineStatus,
    isProfileOpen,
    toggleProfile
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};