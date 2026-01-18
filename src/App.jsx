import RestaurantLogin from "./pages/RestaurantLogin"
import RestaurantSignup from "./pages/RestaurantSignup"


import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';
import Header from './components/Header/Header';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import Menu from './pages/Menu/Menu';
import Report from './pages/Report/Report';
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

function App() {
  return (
    <RestaurantProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/*" element={<AppLayout />} />
          <Route path="/restaurant/login" element={<RestaurantLogin />} />
          <Route path="/restaurant/signup" element={<RestaurantSignup />} />


        </Routes>
      </Router>
    </RestaurantProvider>
  );
}

export default App;

