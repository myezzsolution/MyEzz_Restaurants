import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getRestaurantDetails } from '../services/menuService';

const RestaurantContext = createContext();

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children, restaurantId }) => {
  const [restaurantName, setRestaurantName] = useState('Loading...');
  const [restaurantData, setRestaurantData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Orders & Notifications
  const [orders, setOrders] = useState([]);
  const [notification, setNotification] = useState(null); // { message, order }
  const [isSoundBlocked, setIsSoundBlocked] = useState(false);
  const lastOrderCountRef = useRef(0);

  // Import locally to avoid circular dependency issues if any, but standard import is fine
  // keeping the valid imports
  useEffect(() => {
    if (restaurantId) {
      if (restaurantData) {
        // Start polling only after we have restaurant data (to filter by name)
        const stopPolling = startOrderPolling(restaurantData.name);
        return () => stopPolling();
      } else {
         fetchRestaurantData();
      }
    }
  }, [restaurantId, restaurantData]); // Re-run if restaurantData loads

  // Initial Data Fetch
  const fetchRestaurantData = async () => {
    try {
      setIsLoading(true);
      const data = await getRestaurantDetails(restaurantId);
      setRestaurantData(data);
      setRestaurantName(data?.name || 'Unknown Restaurant');
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
      setRestaurantName('Error Loading');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Global Order Logic ---

  const playSound = async () => {
    try {
      const audio = new Audio('/ding.mp3');
      await audio.play();
      setIsSoundBlocked(false);
    } catch (error) {
      console.error('Error playing notification sound:', error);
      if (error.name === 'NotAllowedError') {
        setIsSoundBlocked(true);
      }
    }
  };

  const startOrderPolling = (restaurantName) => {
    const loadOrders = async () => {
      try {
        const { fetchActiveOrders } = await import('../services/centralOrderService'); // Dynamic import to be safe or just standard
        const data = await fetchActiveOrders();
        
        // Filter for THIS restaurant
        let ordersForThisRestaurant = data;
        if (restaurantName) {
            ordersForThisRestaurant = data.filter(order => 
                order.restaurant_id?.toLowerCase().includes(restaurantName.toLowerCase())
            );
        }
        
        // Filter active only (not rider managed)
        const relevantOrders = ordersForThisRestaurant.filter(order => {
            const riderManagedStatuses = ['pickup_completed', 'delivery_started', 'out_for_delivery', 'delivered'];
            return !riderManagedStatuses.includes(order.status);
        });

        // Transform
        const transformedOrders = relevantOrders.map(order => ({
            id: order._id,
            customerName: order.customer_id,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.qty
            })),
            total: order.total_amount || order.items.reduce((sum, item) => sum + (item.price * item.qty), 0),
            status: mapBackendStatus(order.status),
            verificationCode: '####', // Simplified, or generate if needed
            prepTime: order.prepTime,
            acceptedAt: order.acceptedAt ? new Date(order.acceptedAt) : null,
            originalStatus: order.status
        }));
        
        setOrders(transformedOrders);

        // Check for NEW orders for notification
        const currentNewOrders = transformedOrders.filter(o => o.status === 'new');
        if (currentNewOrders.length > lastOrderCountRef.current) {
            // Find the newest order to show in notification
            // For simplicity, just show generic or the last one. 
            // In a real generic polling, distinguishing "which" is new requires diffing IDs.
            // Here, if count increased, we assume the latest one in the list is the new one or just notify.
            const newOrder = currentNewOrders[currentNewOrders.length - 1];
            if (newOrder) {
                setNotification(newOrder); // Sets the order object to display
                playSound();
            }
        }
        lastOrderCountRef.current = currentNewOrders.length;

      } catch (err) {
        console.error('Global Polling Error:', err);
      }
    };

    // Initial load
    loadOrders();
    // Poll
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  };

  function mapBackendStatus(backendStatus) {
    const statusMap = {
      'pending': 'new',
      'preparing': 'preparing',
      'ready': 'ready',
      'accepted': 'new',
      'cancelled': 'rejected'
    };
    return statusMap[backendStatus] || 'new';
  }

  const dismissNotification = () => {
    setNotification(null);
  };
    
  const setOnlineStatus = (status) => {
    setIsOnline(status);
  };

  const toggleProfile = (isOpen) => {
    setIsProfileOpen(isOpen);
  };

  const toggleMobileMenu = (isOpen) => {
    setIsMobileMenuOpen(isOpen);
  };

  const value = {
    restaurantId,
    restaurantName,
    restaurantData,
    isOnline,
    setOnlineStatus,
    isProfileOpen,
    toggleProfile,
    isMobileMenuOpen,
    toggleMobileMenu,
    isLoading,
    refetchRestaurant: fetchRestaurantData,
    // New Global Exports
    orders,
    setOrders, // Exposed so Dashboard can update active state immediately (optimistic UI)
    notification,
    dismissNotification,
    isSoundBlocked,
    enableSound: playSound
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
