import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderCard from '../../components/OrderCard/OrderCard';
import PrepTimeModal from '../../components/PrepTimeModal/PrepTimeModal';
import RejectionModal from '../../components/RejectionModal/RejectionModal';
import RingSpinner from '../../components/Spinner/Spinner';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  initializeSocket,
  disconnectSocket,
  fetchOrders,
  acceptOrder as acceptOrderAPI,
  rejectOrder as rejectOrderAPI,
  markOrderReady as markOrderReadyAPI
} from '../../services/restaurantOrderService';
import styles from './Dashboard.module.css';

function Dashboard() {
  const { restaurantId } = useRestaurant();
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToReject, setOrderToReject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('new');

  const transformOrder = useCallback((apiOrder) => ({
    id: apiOrder.orderId || apiOrder.order_id,
    customerName: apiOrder.customerName || apiOrder.customer_name,
    customerPhone: apiOrder.customerPhone || apiOrder.customer_phone,
    items: apiOrder.items || [],
    total: apiOrder.total,
    status: mapApiStatus(apiOrder.status),
    apiStatus: apiOrder.status, // Keep original for API calls
    prepTime: apiOrder.prepTime || apiOrder.prep_time,
    acceptedAt: apiOrder.acceptedAt || apiOrder.accepted_at,
    verificationCode: apiOrder.verificationCode || apiOrder.verification_code,
    createdAt: apiOrder.createdAt || apiOrder.created_at,
    deliveryAddress: apiOrder.deliveryAddress || apiOrder.delivery_address
  }), []);

  const mapApiStatus = (apiStatus) => {
    const statusMap = {
      'pending_restaurant': 'new',
      'preparing': 'preparing',
      'ready_for_pickup': 'ready',
      'rider_assigned': 'ready',
      'picked_up': 'completed',
      'out_for_delivery': 'completed',
      'delivered': 'completed',
      'rejected': 'rejected',
      'cancelled': 'cancelled'
    };
    return statusMap[apiStatus] || apiStatus;
  };

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setError(null);
      const response = await fetchOrders(restaurantId, 'active');
      if (response.success && response.data) {
        const transformedOrders = response.data.map(transformOrder);
        setOrders(transformedOrders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, transformOrder]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadOrders();

    const socket = initializeSocket(restaurantId, {
      onConnect: () => console.log('Connected to order server'),
      onDisconnect: () => console.log('Disconnected from order server'),
      onNewOrder: (data) => {
        const newOrder = transformOrder(data.order);
        setOrders(prev => {
          const exists = prev.some(o => o.id === newOrder.id);
          if (exists) return prev;
          return [newOrder, ...prev];
        });
      },
      onOrderUpdate: (data) => {
        if (data.order) {
          const updatedOrder = transformOrder(data.order);
          setOrders(prev => prev.map(order => 
            order.id === updatedOrder.id ? updatedOrder : order
          ));
        }
      },
      onStatusChange: () => loadOrders()
    });

    return () => disconnectSocket();
  }, [restaurantId, loadOrders, transformOrder]);

  const handleAcceptOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleRejectOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setOrderToReject(order);
    setRejectionModalOpen(true);
  };

  const handleConfirmReject = async (reason) => {
    if (!orderToReject || !restaurantId) return;
    
    try {
      await rejectOrderAPI(restaurantId, orderToReject.id, reason);
      setOrders(orders.filter(order => order.id !== orderToReject.id));
      setOrderToReject(null);
    } catch (err) {
      console.error('Failed to reject order:', err);
      alert('Failed to reject order. Please try again.');
    }
  };

  const handleConfirmPrepTime = async (prepTime) => {
    if (!selectedOrder || !restaurantId) return;
    
    try {
      await acceptOrderAPI(restaurantId, selectedOrder.id, prepTime);
      setOrders(orders.map(order =>
        order.id === selectedOrder.id
          ? {
            ...order,
            status: 'preparing',
            apiStatus: 'preparing',
            prepTime,
            acceptedAt: new Date().toISOString()
          }
          : order
      ));
      setSelectedOrder(null);
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to accept order:', err);
      alert('Failed to accept order. Please try again.');
    }
  };

  const handleMarkReady = async (orderId) => {
    if (!restaurantId) return;
    
    try {
      await markOrderReadyAPI(restaurantId, orderId);
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'ready', apiStatus: 'ready_for_pickup' }
          : order
      ));
    } catch (err) {
      console.error('Failed to mark ready:', err);
      alert('Failed to mark order as ready. Please try again.');
    }
  };

  const handleHandToRider = (orderId) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  const newOrders = orders.filter(order => order.status === 'new');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');

  // Card animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingContainer}>
          <RingSpinner size={48} />
          <p className={styles.loadingText}>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingContainer}>
          <p className={styles.errorText}>{error}</p>
          <button 
            onClick={loadOrders}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.title}>Orders</h1> {/* Changed from Kitchen Dashboard to Orders */}
        <div className={styles.statsRibbon}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{newOrders.length}</span>
            <div className={styles.statDetails}>
              <span className={styles.statLabel}>New Orders</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{preparingOrders.length}</span>
            <div className={styles.statDetails}>
              <span className={styles.statLabel}>Preparing</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{readyOrders.length}</span>
            <div className={styles.statDetails}>
              <span className={styles.statLabel}>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar - Hidden on desktop via CSS */}
      <div className={styles.mobileTabs}>
        <button
          className={`${styles.mobileTab} ${activeTab === 'new' ? styles.mobileTabActive : ''}`}
          onClick={() => setActiveTab('new')}
        >
          New
          {newOrders.length > 0 && <span className={styles.tabBadge}>{newOrders.length}</span>}
        </button>
        <button
          className={`${styles.mobileTab} ${activeTab === 'preparing' ? styles.mobileTabActive : ''}`}
          onClick={() => setActiveTab('preparing')}
        >
          Preparing
          {preparingOrders.length > 0 && <span className={styles.tabBadge}>{preparingOrders.length}</span>}
        </button>
        <button
          className={`${styles.mobileTab} ${activeTab === 'ready' ? styles.mobileTabActive : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          Ready
          {readyOrders.length > 0 && <span className={styles.tabBadge}>{readyOrders.length}</span>}
        </button>
      </div>

      <div className={styles.kanbanBoard}>
        <div className={`${styles.kanbanColumn} ${activeTab !== 'new' ? styles.mobileHidden : ''}`}>
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>
              New Orders
              <span className={styles.columnCount}>{newOrders.length}</span>
            </h2>
          </div>
          <div className={styles.columnContent}>
            <AnimatePresence mode="popLayout">
              {newOrders.map(order => (
                <motion.div
                  key={order.id}
                  layout
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <OrderCard
                    order={order}
                    onAccept={handleAcceptOrder}
                    onReject={handleRejectOrder}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {newOrders.length === 0 && (
              <div className={styles.emptyState}>
                <p>No new orders</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.kanbanColumn} ${activeTab !== 'preparing' ? styles.mobileHidden : ''}`}>
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>
              Preparing
              <span className={styles.columnCount}>{preparingOrders.length}</span>
            </h2>
          </div>
          <div className={styles.columnContent}>
            <AnimatePresence mode="popLayout">
              {preparingOrders.map(order => (
                <motion.div
                  key={order.id}
                  layout
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <OrderCard
                    order={order}
                    onMarkReady={handleMarkReady}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {preparingOrders.length === 0 && (
              <div className={styles.emptyState}>
                <p>No orders in preparation</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.kanbanColumn} ${activeTab !== 'ready' ? styles.mobileHidden : ''}`}>
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>
              Ready
              <span className={styles.columnCount}>{readyOrders.length}</span>
            </h2>
          </div>
          <div className={styles.columnContent}>
            <AnimatePresence mode="popLayout">
              {readyOrders.map(order => (
                <motion.div
                  key={order.id}
                  layout
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <OrderCard
                    order={order}
                    onHandToRider={handleHandToRider}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {readyOrders.length === 0 && (
              <div className={styles.emptyState}>
                <p>No orders ready</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PrepTimeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmPrepTime}
        orderDetails={selectedOrder}
      />

      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleConfirmReject}
        orderDetails={orderToReject}
      />
    </div>
  );
}

export default Dashboard;
