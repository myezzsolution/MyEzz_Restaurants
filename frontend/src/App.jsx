import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import './App.css';

function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return <Landing />;
  }

  return (
    <div className="app">
      <Header />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/orders" element={<Dashboard />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/report" element={<Report />} />
        </Routes>

        <Footer />
      </main>
    </div>
  );
}

const AppContent = () => {
  const { isProfileOpen } = useRestaurant();
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Router>
      <AnimatePresence>
        {isProfileOpen && <Profile />}
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <RestaurantProvider>
      <AppContent />
    </RestaurantProvider>
  );
}

export default App;
