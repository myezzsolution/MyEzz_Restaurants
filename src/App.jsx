import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import Header from './components/Header/Header';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import Menu from './pages/Menu/Menu';
import Report from './pages/Report/Report';
import Profile from './pages/Profile/Profile';
import Landing from './pages/Landing/Landing';
import OrderHistory from './pages/OrderHistory/OrderHistory';
import RestaurantSignup from './pages/RestaurantSignup';
import RestaurantLogin from './pages/RestaurantLogin';
import Register from './pages/Register/Register';
import RegistrationWizard from './pages/Register/RegistrationWizard';
import OrderNotificationToast from './components/Toast/OrderNotificationToast';

import './App.css';

// Layout for restaurant-specific pages
function RestaurantLayout() {
  const { restaurantId } = useParams();

  // Basic validation: if restaurantId is not a valid number, redirect to default
  const numericId = parseInt(restaurantId, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is authenticated
  const session = localStorage.getItem('myezz_session');
  if (!session) {
    // Not logged in - redirect to login
    return <Navigate to="/login" replace />;
  }

  try {
    const { restaurantId: sessionRestaurantId } = JSON.parse(session);
    // Verify user is accessing their own restaurant
    if (sessionRestaurantId !== numericId) {
      // User trying to access different restaurant - redirect to their own
      return <Navigate to={`/${sessionRestaurantId}/orders`} replace />;
    }
  } catch (e) {
    // Invalid session - clear and redirect to login
    localStorage.removeItem('myezz_session');
    return <Navigate to="/login" replace />;
  }

  return (
    <RestaurantProvider restaurantId={numericId}>
      <RestaurantLayoutContent />
    </RestaurantProvider>
  );
}

function RestaurantLayoutContent() {
  const { isProfileOpen, notification, dismissNotification, restaurantId } = useRestaurant();

  return (
    <>
      <OrderNotificationToast 
        order={notification} 
        onClose={dismissNotification} 
        restaurantId={restaurantId} 
      />
      <div className="app">
        <Header />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="orders" element={<Dashboard />} />
            <Route path="menu" element={<Menu />} />
            <Route path="report" element={<Report />} />
            <Route path="history" element={<OrderHistory />} />

            <Route path="" element={<Navigate to="menu" replace />} />
          </Routes>
          <Footer />
        </main>
      </div>
      <AnimatePresence>
        {isProfileOpen && <Profile />}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<RestaurantSignup />} />
        <Route path="/login" element={<RestaurantLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<RegistrationWizard />} />

        {/* Restaurant Specific Routes */}
        {/* The RestaurantLayout maps to /:restaurantId/* so it handles sub-routes */}
        <Route path="/:restaurantId/*" element={<RestaurantLayout />} />

        {/* Helper: if someone types just /:restaurantId, go to menu by default */}
        {/* Note: This is handled inside RestaurantLayout routes usually, but we can have a fallback here if needed, 
            though the wildcard above handles it. The RestaurantLayout definition handles redirects. */}

        {/* Catch-all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

