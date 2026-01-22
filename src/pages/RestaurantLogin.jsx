import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Phone, Mail, ExternalLink } from "lucide-react";
import "./RestaurantLogin.css";

export default function RestaurantLogin() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Tech-first dot grid pattern with stronger orange presence
  const dotGridPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23FF6600' fill-opacity='0.12'/%3E%3C/svg%3E")`;

  const wrapperStyle = {
    backgroundColor: "#0a0a0a",
    backgroundImage: `
      radial-gradient(ellipse at 70% 20%, rgba(255, 102, 0, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 30% 80%, rgba(255, 140, 0, 0.1) 0%, transparent 50%),
      ${dotGridPattern}, 
      linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)
    `,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 9999,
    fontFamily: "'Inter', sans-serif"
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
          <form style={formBaseStyle} onSubmit={(e) => e.preventDefault()}>
            <h1 className="title">Create Account</h1>
            <input type="text" placeholder="Restaurant Name" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            
            <label className="terms-checkbox">
              <input 
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="terms-text">I agree to the Terms and Policies</span>
            </label>

            <button type="submit" className="btn-main btn-signup" disabled={!agreedToTerms}>
              Get Started
            </button>
          </form>
        </div>

        {/* Login Form */}
        <div className="form-container sign-in">
          <form style={formBaseStyle} onSubmit={(e) => e.preventDefault()}>
            <h1 className="title">Welcome Back</h1>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <a href="#" className="forgot">Forgot Your Password?</a>
            <button type="submit" className="btn-main" onClick={() => navigate('/1/orders')}>Sign In</button>
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
            src="/myezzlogopage0001removebgpreview1338-07fh-400h.png" 
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