// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { RestaurantProvider, useRestaurant } from "./context/RestaurantContext";

// Components
import Header from "./components/Header/Header";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

// Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import Menu from "./pages/Menu/Menu";
import Report from "./pages/Report/Report";
import Profile from "./pages/Profile/Profile";
import Landing from "./pages/Landing/Landing";
import RestaurantLogin from "./pages/RestaurantLogin"; // Corrected path for fresh clone

import "./App.css";

/**
 * Layout component for authenticated/selected restaurant views.
 * It provides the RestaurantContext to all child routes.
 */
function RestaurantLayout() {
  const { restaurantId } = useParams();

  // Basic validation to ensure a restaurantId exists in the URL
  if (!restaurantId) {
    return <Navigate to="/" replace />;
  }

  return (
    <RestaurantProvider restaurantId={restaurantId}>
      <div className="app">
        <Header />
        <Navbar />
        <main className="main-content">
          <Outlet /> {/* This renders Dashboard, Menu, or Report based on the URL */}
          <Footer />
        </main>
      </div>
      {/* Profile is rendered outside main layout flow but inside Provider */}
      <RestaurantProfile />
    </RestaurantProvider>
  );
}

/**
 * Component to handle the animated Profile overlay
 */
function RestaurantProfile() {
  const { isProfileOpen } = useRestaurant();

  return (
    <AnimatePresence>
      {isProfileOpen && <Profile />}
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/restaurant/login" element={<RestaurantLogin />} />

        {/* Protected/Dynamic Restaurant Routes */}
        <Route path="/:restaurantId" element={<RestaurantLayout />}>
          <Route path="orders" element={<Dashboard />} />
          <Route path="menu" element={<Menu />} />
          <Route path="report" element={<Report />} />
          
          {/* Default child route: Redirects /123 to /123/menu */}
          <Route index element={<Navigate to="menu" replace />} />
        </Route>

        {/* Catch-all: Redirects any unknown URL back to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;