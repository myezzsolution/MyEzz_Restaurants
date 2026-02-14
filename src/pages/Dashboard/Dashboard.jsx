import { useState, useRef } from 'react'; // removed unused useEffect
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '../../context/RestaurantContext'; // Import context
import OrderCard from '../../components/OrderCard/OrderCard';
import PrepTimeModal from '../../components/PrepTimeModal/PrepTimeModal';
import RejectionModal from '../../components/RejectionModal/RejectionModal';
import RingSpinner from '../../components/Spinner/Spinner';
import WarningToast from '../../components/ui/WarningToast';
import styles from './Dashboard.module.css';
import { updateOrderStatus } from '../../services/centralOrderService';

function Dashboard() {
  // Use global orders from context
  const { 
    orders, 
    setOrders, 
    isLoading: loading, 
    isSoundBlocked, 
    enableSound 
  } = useRestaurant();

  const [modalOpen, setModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToReject, setOrderToReject] = useState(null);
  const [error, setError] = useState(null); // Keep error state if needed, though context handles loading errors
  const [activeTab, setActiveTab] = useState('new');
  const [warningId, setWarningId] = useState(0);

  const handleValidationFail = () => {
    setWarningId(Date.now());
  };

  // Removed local polling, sound logic, and backend mapping


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
            <AnimatePresence mode="sync">
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
            <AnimatePresence mode="sync">
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
            <AnimatePresence mode="sync">
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
