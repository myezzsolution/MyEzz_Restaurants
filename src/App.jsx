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

import './App.css';

// Layout for restaurant-specific pages
function RestaurantLayout() {
  const { restaurantId } = useParams();

  // Basic validation: if restaurantId is not a valid number, redirect to default
  const numericId = parseInt(restaurantId, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return <Navigate to="/1/menu" replace />;
  }

  return (
    <RestaurantProvider restaurantId={numericId}>
      <RestaurantLayoutContent />
    </RestaurantProvider>
  );
}

function RestaurantLayoutContent() {
  const { isProfileOpen } = useRestaurant();

  return (
    <>
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/1/menu" replace />} />
        <Route path="/:restaurantId/*" element={<RestaurantLayout />} />
        <Route path="*" element={<Navigate to="/1/menu" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

