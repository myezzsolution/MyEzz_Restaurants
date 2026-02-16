import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Phone, Mail, ExternalLink, User, Lock, Facebook, Twitter, Building2, MapPin, Loader2, Eye, EyeOff } from "lucide-react";
import useKeyboard from "../hooks/useKeyboard";
import { API_BASE_URL } from "../config";
import "./RestaurantLogin.css";

// Mobile Login Layout Component
const MobileLoginForm = ({ 
  loginEmail, setLoginEmail, 
  loginPassword, setLoginPassword, 
  showPassword, setShowPassword, 
  loginError, isLoading, 
  handleSignIn, setIsActive 
}) => (
  <div className="mobile-login-fullscreen">
    {/* Image Header with Welcome Text */}
    <div className="mobile-card-header">
      <h1 className="mobile-welcome-text">Welcome Back,<br />Partner!</h1>
      {/* Curved Separator SVG */}
      <div className="mobile-curve-separator">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,20 Q50,0 100,20 L100,20 L0,20 Z" fill="#FFFFFF" />
        </svg>
      </div>
    </div>

    {/* White Form Section */}
    <form className="mobile-form-section" onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
      <div className="mobile-input-group">
        <User className="mobile-input-icon" size={22} />
        <input
          type="text"
          placeholder="Username"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
        />
      </div>

      <div className="mobile-input-group">
        <Lock className="mobile-input-icon" size={22} />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
        />
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#666', 
            padding: '0 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {loginError && (
        <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
          {loginError}
        </div>
      )}

      <button type="submit" className="mobile-cta-button" disabled={isLoading}>
        {isLoading ? <Loader2 size={20} className="spin-animation" /> : 'Sign In'}
      </button>

      <a href="#" className="mobile-forgot-link">Forgot Password?</a>

      <div className="mobile-toggle-text">
        Don't have an account? <a onClick={() => setIsActive(true)}>Create Account</a>
      </div>
    </form>

    {/* Footer */}
    <div className="mobile-fullscreen-footer">
      <div className="mobile-footer-row">
        <a href="https://my-ezz.vercel.app/" target="_blank" rel="noopener noreferrer">MyEzz</a>
        <a href="https://myezzofficial.netlify.app/about" target="_blank" rel="noopener noreferrer">About</a>
        <a href="https://myezzofficial.netlify.app/contact" target="_blank" rel="noopener noreferrer">Contact</a>
      </div>
      <div className="mobile-footer-row">
        <a href="https://www.instagram.com/mycravezz/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={20} /></a>
        <a href="tel:+918097021356" aria-label="Phone"><Phone size={20} /></a>
        <a href="mailto:myeasycheckout@gmail.com" aria-label="Email"><Mail size={20} /></a>
      </div>
      <span className="mobile-footer-copyright">© 2026 MyEzz Partner. All rights reserved.</span>
    </div>
  </div>
);

// Mobile Signup Layout Component
const MobileSignupForm = ({
  signupData, setSignupData,
  handleSignUp, setIsActive
}) => (
  <motion.div
    className="mobile-login-fullscreen"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
  >
    {/* Back Button */}
    <button
      className="mobile-back-btn"
      onClick={() => setIsActive(false)}
    >
      ← Back to Login
    </button>
    {/* Image Header */}
    <div className="mobile-card-header mobile-signup-header">
      <h1 className="mobile-welcome-text" style={{ fontSize: '1.5rem' }}>Create Your<br />Partner Account</h1>
      <div className="mobile-curve-separator">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,20 Q50,0 100,20 L100,20 L0,20 Z" fill="#FFFFFF" />
        </svg>
      </div>
    </div>

    {/* White Form Section */}
    <div
      className="mobile-form-section"
      style={{ maxHeight: '55vh', overflowY: 'auto' }}
    >
      <div className="mobile-input-group">
        <Building2 className="mobile-input-icon" size={22} />
        <input
          type="text"
          placeholder="Restaurant / Business Name"
          value={signupData.restaurantName}
          onChange={(e) => setSignupData({ ...signupData, restaurantName: e.target.value })}
        />
      </div>

      <div className="mobile-input-group">
        <User className="mobile-input-icon" size={22} />
        <input
          type="text"
          placeholder="Owner / Partner Name"
          value={signupData.ownerName}
          onChange={(e) => setSignupData({ ...signupData, ownerName: e.target.value })}
        />
      </div>

      <div className="mobile-input-group">
        <Phone className="mobile-input-icon" size={22} />
        <input
          type="tel"
          placeholder="Mobile Number"
          value={signupData.mobile}
          onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })}
        />
      </div>

      <div className="mobile-input-group">
        <Mail className="mobile-input-icon" size={22} />
        <input
          type="email"
          placeholder="Email Address"
          value={signupData.email}
          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
        />
      </div>

      <div className="mobile-input-group">
        <Lock className="mobile-input-icon" size={22} />
        <input
          type="password"
          placeholder="Password"
          value={signupData.password}
          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
        />
      </div>

      <div className="mobile-input-group">
        <MapPin className="mobile-input-icon" size={22} />
        <input
          type="text"
          placeholder="City / Location"
          value={signupData.city}
          onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
        />
      </div>

      <div className="mobile-input-group">
        <Building2 className="mobile-input-icon" size={22} />
        <select
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            padding: 0,
            fontSize: '1rem',
            color: '#333',
            outline: 'none'
          }}
          value={signupData.businessType}
          onChange={(e) => setSignupData({ ...signupData, businessType: e.target.value })}
        >
          <option value="Restaurant">Restaurant</option>
          <option value="Cafe">Cafe</option>
          <option value="Cloud Kitchen">Cloud Kitchen</option>
        </select>
      </div>

      <button className="mobile-cta-button" onClick={handleSignUp}>
        Create Account
      </button>

      <div className="mobile-toggle-text">
        Already have an account? <a onClick={() => setIsActive(false)}>Sign In</a>
      </div>
    </div>

    {/* Footer */}
    <div className="mobile-fullscreen-footer">
      <span className="mobile-footer-copyright">© 2026 MyEzz Partner. All rights reserved.</span>
    </div>
  </motion.div>
);

export default function RestaurantLogin() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Keyboard navigation: Escape to go back to Sign In
  useKeyboard({
    onEscape: () => {
      if (isActive) setIsActive(false);
    }
  }, [isActive], true);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupData, setSignupData] = useState({
    restaurantName: "",
    ownerName: "",
    mobile: "",
    email: "",
    password: "",
    city: "",
    businessType: "Restaurant"
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if already logged in
  useEffect(() => {
    const session = localStorage.getItem('myezz_session');
    if (session) {
      const { restaurantId } = JSON.parse(session);
      navigate(`/${restaurantId}/orders`);
    }
  }, [navigate]);

  // Tech-first dot grid pattern with stronger orange presence
  const dotGridPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23FF6600' fill-opacity='0.12'/%3E%3C/svg%3E")`;

  const wrapperStyle = {
    backgroundColor: "#0a0a0a",
    backgroundImage: isMobile
      ? `linear-gradient(160deg, #FF6600 0%, #FF8C00 25%, #4a4a4a 60%, #2a2a2a 100%)`
      : `
      radial-gradient(ellipse at 70% 20%, rgba(255, 102, 0, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 30% 80%, rgba(255, 140, 0, 0.1) 0%, transparent 50%),
      ${dotGridPattern}, 
      linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)
    `,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: isMobile ? "100dvh" : "100vh",
    width: "100%",
    position: isMobile ? "relative" : "fixed", // Changed from fixed to relative for mobile to handle keyboard
    top: 0,
    left: 0,
    zIndex: 9999,
    fontFamily: "'Inter', sans-serif",
    padding: isMobile ? "1rem" : 0,
    overflowY: isMobile ? "auto" : "hidden" // Allow scrolling on mobile
  };

  const formBaseStyle = {
    backgroundColor: "#1e1e1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    padding: "0 40px",
    height: "100%"
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Save session to localStorage
      localStorage.setItem('myezz_session', JSON.stringify({
        restaurantId: data.data.restaurantId,
        restaurantName: data.data.restaurantName,
        username: data.data.username
      }));

      // Navigate to orders page
      navigate(`/${data.data.restaurantId}/orders`);

    } catch (error) {
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(''); // Clear any previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Signup failed');
      }

      // Save session to localStorage
      localStorage.setItem('myezz_session', JSON.stringify({
        restaurantId: data.data.restaurantId,
        restaurantName: data.data.restaurantName,
        username: data.data.username
      }));

      // Navigate to orders page
      navigate(`/${data.data.restaurantId}/orders`);

    } catch (error) {
      setLoginError(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div style={wrapperStyle}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          {!isActive ? (
            <MobileLoginForm 
              loginEmail={loginEmail}
              setLoginEmail={setLoginEmail}
              loginPassword={loginPassword}
              setLoginPassword={setLoginPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loginError={loginError}
              isLoading={isLoading}
              handleSignIn={handleSignIn}
              setIsActive={setIsActive}
            />
          ) : (
            <MobileSignupForm 
              signupData={signupData}
              setSignupData={setSignupData}
              handleSignUp={handleSignUp}
              setIsActive={setIsActive}
            />
          )}
        </motion.div>
      </div>
    );
  }

  // Desktop Layout (unchanged)
  return (
    <div style={wrapperStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`container ${isActive ? "active" : ""}`}
        id="container"
      >

        {/* Sign Up Form */}
        <div className="form-container sign-up">
          <form style={formBaseStyle} onSubmit={handleSignUp}>
            <h1 className="title">Create Account</h1>
            <input 
              type="text" 
              placeholder="Restaurant Name" 
              value={signupData.restaurantName}
              onChange={(e) => setSignupData({...signupData, restaurantName: e.target.value})}
              required
            />
            <input 
              type="text" 
              placeholder="Owner Name" 
              value={signupData.ownerName}
              onChange={(e) => setSignupData({...signupData, ownerName: e.target.value})}
              required
            />
            <input 
              type="tel" 
              placeholder="Mobile Number" 
              value={signupData.mobile}
              onChange={(e) => setSignupData({...signupData, mobile: e.target.value})}
              required
            />
            <input 
              type="email" 
              placeholder="Email" 
              value={signupData.email}
              onChange={(e) => setSignupData({...signupData, email: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={signupData.password}
              onChange={(e) => setSignupData({...signupData, password: e.target.value})}
              required
            />

            <label className="terms-checkbox">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="terms-text">I agree to the Terms and Policies</span>
            </label>

            {loginError && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {loginError}
              </div>
            )}

            <button type="submit" className="btn-main btn-signup" disabled={!agreedToTerms || isLoading}>
              {isLoading ? <Loader2 size={18} className="spin-animation" /> : 'Get Started'}
            </button>
          </form>
        </div>

        {/* Login Form */}
        <div className="form-container sign-in">
          <form style={formBaseStyle} onSubmit={handleSignIn}>
            <h1 className="title">Welcome Back</h1>
            <input 
              type="text" 
              placeholder="Username" 
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ width: '100%' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loginError && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {loginError}
              </div>
            )}
            <a href="#" className="forgot">Forgot Your Password?</a>
            <button type="submit" className="btn-main" disabled={isLoading}>
              {isLoading ? <Loader2 size={18} className="spin-animation" /> : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Toggle Panels */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Manage Your Kitchen.</h1>
              <p>Real-time orders, payouts, and insights.</p>
              <button className="toggle-btn" onClick={() => setIsActive(false)}>Sign In</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Turn Tables Faster.</h1>
              <p>Join 30+ restaurants managing orders in real-time.</p>
              <button className="toggle-btn" onClick={() => setIsActive(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-brand">
          <img
            src="/Myezz_logo.svg"
            alt="MyEzz"
            className="footer-logo"
          />
        </div>

        <div className="footer-links">
          <a href="https://my-ezz.vercel.app/" target="_blank" rel="noopener noreferrer">
            MyEzz <ExternalLink size={12} />
          </a>
          <a href="https://myezzofficial.netlify.app/about" target="_blank" rel="noopener noreferrer">
            About <ExternalLink size={12} />
          </a>
          <a href="https://myezzofficial.netlify.app/contact" target="_blank" rel="noopener noreferrer">
            Contact <ExternalLink size={12} />
          </a>
        </div>

        <div className="footer-social">
          <a href="https://www.instagram.com/mycravezz/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Instagram size={18} />
          </a>
          <a href="tel:+918097021356" aria-label="Phone">
            <Phone size={18} />
          </a>
          <a href="mailto:myeasycheckout@gmail.com" aria-label="Email">
            <Mail size={18} />
          </a>
        </div>

        <p className="footer-copyright">© 2026 MyEzz Partner. All rights reserved.</p>
      </footer>
    </div>
  );
}