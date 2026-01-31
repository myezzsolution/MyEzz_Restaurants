import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderCard from '../../components/OrderCard/OrderCard';
import PrepTimeModal from '../../components/PrepTimeModal/PrepTimeModal';
import RejectionModal from '../../components/RejectionModal/RejectionModal';
import RingSpinner from '../../components/Spinner/Spinner';
import WarningToast from '../../components/ui/WarningToast';
import styles from './Dashboard.module.css';
import { fetchActiveOrders, updateOrderStatus } from '../../services/centralOrderService';

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToReject, setOrderToReject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('new'); // For mobile tab view
  const [warningId, setWarningId] = useState(0);

  // Sound notification
  const lastOrderCountRef = useRef(0);
  const [isSoundBlocked, setIsSoundBlocked] = useState(false);

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

  useEffect(() => {
    const currentNewOrders = orders.filter(o => o.status === 'new').length;
    
    // Play sound if we have more new orders than before
    if (currentNewOrders > lastOrderCountRef.current) {
      playSound();
    }
    
    lastOrderCountRef.current = currentNewOrders;
  }, [orders]);

  const enableSound = () => {
    playSound();
  };

  const handleValidationFail = () => {
    setWarningId(Date.now());
  };

  // Fetch orders from Central Backend
  useEffect(() => {
    const loadOrders = async (isBackground = false) => {
      // Only show full loading spinner on first load, not background polls
      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      try {
        // Fetch all active orders from Central Backend
        const data = await fetchActiveOrders();
        
        // Transform backend data to match frontend format
        const transformedOrders = data.map(order => ({
          id: order._id,
          customerName: order.customer_id,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.qty
          })),
          total: order.total_amount || order.items.reduce((sum, item) => sum + (item.price * item.qty), 0),
          status: mapBackendStatus(order.status),
          verificationCode: generateVerificationCode(),
          prepTime: order.prepTime,
          acceptedAt: order.acceptedAt ? new Date(order.acceptedAt) : null
        }));
        
        setOrders(transformedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        if (!isBackground) {
          setError('Failed to load orders.');
          setOrders([]);
        }
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    };

    // Initial load
    loadOrders(false);
    
    // Poll for new orders every 5 seconds (background update)
    const interval = setInterval(() => loadOrders(true), 5000);
    return () => clearInterval(interval);
  }, []);

  // Map backend status to frontend status
  function mapBackendStatus(backendStatus) {
    const statusMap = {
      'pending': 'new',
      'preparing': 'preparing',
      'ready': 'ready',
      'accepted': 'new',  // Rider accepted, but Restaurant still needs to prepare
      'pickup_completed': 'ready',
      'delivery_started': 'ready',
      'out_for_delivery': 'ready',
      'delivered': 'completed',
      'cancelled': 'rejected'
    };
    return statusMap[backendStatus] || 'new';
  }

  function generateVerificationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

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
    if (orderToReject) {
      try {
        await updateOrderStatus(orderToReject.id, 'cancelled');
        console.log(`Rejecting order ${orderToReject.id} for reason: ${reason}`);
        setOrders(orders.filter(order => order.id !== orderToReject.id));
      } catch (err) {
        console.error('Failed to reject order:', err);
      }
      setOrderToReject(null);
    }
  };

  const handleConfirmPrepTime = async (prepTime) => {
    if (selectedOrder) {
      try {
        await updateOrderStatus(selectedOrder.id, 'preparing');
        setOrders(orders.map(order =>
          order.id === selectedOrder.id
            ? {
              ...order,
              status: 'preparing',
              prepTime,
              acceptedAt: new Date()
            }
            : order
        ));
      } catch (err) {
        console.error('Failed to update order status:', err);
      }
    }
    setSelectedOrder(null);
  };

  const handleMarkReady = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'ready');
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'ready' }
          : order
      ));
    } catch (err) {
      console.error('Failed to mark order as ready:', err);
    }
  };

  const handleHandToRider = async (orderId) => {
    try {
      // Just remove from local view - Rider app handles pickup status
      setOrders(orders.filter(order => order.id !== orderId));
      console.log(`Order ${orderId} handed to rider`);
    } catch (err) {
      console.error('Failed to hand order to rider:', err);
    }
  };

  const newOrders = orders.filter(order => order.status === 'new');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');

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

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className={styles.title}>Orders</h1> 
          {isSoundBlocked && (
            <button 
              onClick={enableSound}
              style={{
                backgroundColor: '#FF6600',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold'
              }}
            >
              Enable Sound 🔔
            </button>
          )}
        </div>
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

      {/* Mobile Tab Bar */}
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
                    onValidationFail={handleValidationFail}
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

      {warningId > 0 && (
        <WarningToast 
            key={warningId}
            message="Please tick all items as done before marking ready" 
            isVisible={true}
            onClose={() => setWarningId(0)}
            duration={3000}
        />
      )}
    </div>
  );
}

export default Dashboard;
