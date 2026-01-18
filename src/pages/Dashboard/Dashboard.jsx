import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import OrderCard from '../../components/OrderCard/OrderCard'
import PrepTimeModal from '../../components/PrepTimeModal/PrepTimeModal'
import RejectionModal from '../../components/RejectionModal/RejectionModal'
import RingSpinner from '../../components/Spinner/Spinner'
import styles from './Dashboard.module.css'

function Dashboard() {
  const [orders, setOrders] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderToReject, setOrderToReject] = useState(null)
  const [loading, setLoading] = useState(true)

  const audioRef = useRef(null)
  const prevCountRef = useRef(0)

  

  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3")
  }, [])
  
  useEffect(() => {
    if (orders.length > prevCountRef.current && prevCountRef.current !== 0) {
      audioRef.current?.play().catch(() => {
        console.log("Audio needs user interaction first")
      })
    }
    prevCountRef.current = orders.length
  }, [orders])

  const generateVerificationCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }, [])

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockOrders = [
        {
          id: 'ORD001',
          customerName: 'Yug Patel',
          items: [{ name: 'Margherita Pizza', quantity: 1 }, { name: 'Caesar Salad', quantity: 1 }],
          total: 249.99,
          status: 'new',
          verificationCode: generateVerificationCode()
        },
        {
          id: 'ORD002',
          customerName: 'Aksh Maheshwari',
          items: [{ name: 'Chicken Burger', quantity: 2 }],
          total: 185.00,
          status: 'preparing',
          verificationCode: generateVerificationCode()
        },
        {
          id: 'ORD003',
          customerName: 'Nayan Chellani',
          items: [{ name: 'French Fries', quantity: 1 }],
          total: 157.50,
          status: 'ready',
          verificationCode: generateVerificationCode()
        }
      ]

      setOrders(mockOrders)
      prevCountRef.current = mockOrders.length
      setLoading(false)
    }
    loadOrders()
  }, [generateVerificationCode])

  const handleAcceptOrder = (orderId) => {
    setSelectedOrder(orders.find(o => o.id === orderId))
    setModalOpen(true)
  }

  const handleConfirmPrepTime = (prepTime) => {
    setOrders(orders.map(order => 
      order.id === selectedOrder.id ? { ...order, status: 'preparing', prepTime } : order
    ))
    setModalOpen(false)
  }

  const handleMarkReady = (orderId) => {
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: 'ready' } : order))
  }

  const handleHandToRider = (orderId) => {
    setOrders(orders.filter(order => order.id !== orderId))
  }

  if (loading) return <div className={styles.dashboard}><RingSpinner size={48} /></div>

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h1>Orders</h1>
      </div>

      <div className={styles.kanbanBoard}>
        {}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>NEW ORDERS</h2>
          </div>
          <div className={styles.columnContent}>
            <AnimatePresence mode='popLayout'>
              {orders.filter(o => o.status === 'new').map(order => (
                <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <OrderCard 
                    order={order} 
                    onAccept={() => handleAcceptOrder(order.id)} 
                    onReject={() => { setOrderToReject(order); setRejectionModalOpen(true); }} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>PREPARING</h2>
          </div>
          <div className={styles.columnContent}>
            {orders.filter(o => o.status === 'preparing').map(order => (
              <OrderCard key={order.id} order={order} onMarkReady={() => handleMarkReady(order.id)} />
            ))}
          </div>
        </div>

        {}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>READY</h2>
          </div>
          <div className={styles.columnContent}>
            {orders.filter(o => o.status === 'ready').map(order => (
              <OrderCard key={order.id} order={order} onHandedToRider={() => handleHandToRider(order.id)} />
            ))}
          </div>
        </div>
      </div>

      <PrepTimeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleConfirmPrepTime} orderDetails={selectedOrder} />
      <RejectionModal isOpen={rejectionModalOpen} onClose={() => setRejectionModalOpen(false)} orderDetails={orderToReject} onConfirm={() => {
        setOrders(orders.filter(o => o.id !== orderToReject.id));
        setRejectionModalOpen(false);
      }} />
    </div>
  )
}

export default Dashboard