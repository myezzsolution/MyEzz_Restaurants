import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';
import Header from './components/Header/Header';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Menu from './pages/Menu/Menu';
import Report from './pages/Report/Report';
import './App.css';
import './styles/responsive.css';

function App() {
  return (
    <RestaurantProvider>
      <Router>
        <div className="app">
          <Header />
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/report" element={<Report />} />
            </Routes>
          </main>
        </div>
      </Router>
    </RestaurantProvider>
  );
}

export default App;
