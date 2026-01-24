import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderCard from '../../components/OrderCard/OrderCard';
import PrepTimeModal from '../../components/PrepTimeModal/PrepTimeModal';
import RejectionModal from '../../components/RejectionModal/RejectionModal';
import RingSpinner from '../../components/Spinner/Spinner';
import WarningToast from '../../components/ui/WarningToast';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToReject, setOrderToReject] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockOrders = [
        {
          id: 'ORD001',
          customerName: 'Yug Patel',
          items: [
            { name: 'Margherita Pizza', quantity: 1 },
            { name: 'Caesar Salad', quantity: 1 }
          ],
          total: 249.99,
          status: 'new',
          verificationCode: generateVerificationCode()
        },
        {
          id: 'ORD002',
          customerName: 'Aksh Maheshwari',
          items: [
            { name: 'Chicken Burger', quantity: 2 },
            { name: 'French Fries', quantity: 1 }
          ],
          total: 185.00,
          status: 'preparing',
          prepTime: 25,
          acceptedAt: new Date(Date.now() - 5 * 60 * 1000),
          verificationCode: generateVerificationCode()
        },
        {
          id: 'ORD003',
          customerName: 'Nayan Chellani',
          items: [
            { name: 'French Fries', quantity: 1 }
          ],
          total: 157.50,
          status: 'ready',
          verificationCode: generateVerificationCode()
        }
      ];

      setOrders(mockOrders);
      setLoading(false);
    };

    loadOrders();
  }, []);

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

  const handleConfirmReject = (reason) => {
    if (orderToReject) {
      // In a real app, you would send the rejection reason to the backend here
      console.log(`Rejecting order ${orderToReject.id} for reason: ${reason}`);
      setOrders(orders.filter(order => order.id !== orderToReject.id));
      setOrderToReject(null);
    }
  };

  const handleConfirmPrepTime = (prepTime) => {
    if (selectedOrder) {
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
    }
    setSelectedOrder(null);
  };

  const handleMarkReady = (orderId) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'ready' }
        : order
    ));
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

      {/* Warning Toast for Validation Feedback */}
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
