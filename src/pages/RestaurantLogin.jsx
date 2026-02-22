import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Instagram, Phone, Mail } from "lucide-react";
import ArtisticBackground from "../components/ArtisticBackground/ArtisticBackground";
import useKeyboard from "../hooks/useKeyboard";
import { API_BASE_URL } from "../config";
import "./RestaurantLogin.css";


// ── Floating Dashboard Cards ──────────────────────────────────────────
function SalesCard() {
  return (
    <motion.div
      className="dash-card sales-card"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <p className="dc-label">Sales Report</p>
      <p className="dc-value">₹5,820</p>
      <p className="dc-sub">Today</p>
      <svg width="90" height="34" viewBox="0 0 90 34" style={{ marginTop: 4 }}>
        <polyline
          points="0,30 12,22 24,26 36,14 48,18 60,8 72,12 84,4 90,2"
          fill="none" stroke="#FF6600" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="0,30 12,22 24,26 36,14 48,18 60,8 72,12 84,4 90,2 90,34 0,34"
          fill="rgba(255,102,0,0.12)" stroke="none"
        />
      </svg>
    </motion.div>
  );
}

function OrdersCard() {
  return (
    <motion.div
      className="dash-card orders-card"
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
    >
      <p className="dc-label">New Orders</p>
      <div className="dc-orders-row">
        <p className="dc-orders-num">₹88,220</p>
        <span className="dc-check-big">✓</span>
      </div>
      <div className="dc-bar" style={{ width: '80%', marginTop: 6 }} />
      <div className="dc-bar" style={{ width: '60%', marginTop: 4 }} />
    </motion.div>
  );
}

function EfficiencyCard() {
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <motion.div
      className="dash-card eff-card"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
    >
      <div className="dc-eff-row">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#eee" strokeWidth="7" />
          <circle
            cx="28" cy="28" r={r} fill="none" stroke="#FF6600" strokeWidth="7"
            strokeDasharray={`${0.85 * circ} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
          />
          <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="#333">85%</text>
        </svg>
        <div style={{ marginLeft: 10 }}>
          <p className="dc-label">Efficiency</p>
          <div className="dc-bar" style={{ width: 60, marginTop: 6 }} />
          <div className="dc-bar" style={{ width: 46, marginTop: 5 }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Mobile Layout ─────────────────────────────────────────────────────
function MobileView({ loginEmail, setLoginEmail, loginPassword, setLoginPassword,
  showPassword, setShowPassword, loginError, isLoading, handleSignIn, navigate }) {
  return (
    <div className="mob-wrap">
      <div className="mob-header">
        <img src="/Myezz_logo.svg" alt="MyEzz" className="mob-logo" />
        <h1 className="mob-title">Welcome Back,<br />Partner!</h1>
      </div>
      <form className="mob-form" onSubmit={handleSignIn}>
        <input
          type="text" placeholder="Email / Username"
          value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
        />
        <div className="mob-pw-wrap">
          <input
            type={showPassword ? "text" : "password"} placeholder="Password"
            value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required
          />
          <button type="button" className="mob-eye"
            onClick={() => setShowPassword(p => !p)}
            style={{ color: '#475569' }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {loginError && <p className="mob-error">{loginError}</p>}
        <button type="submit" className="mob-signin-btn" disabled={isLoading}>
          {isLoading ? <Loader2 size={18} className="spin-anim" /> : "Sign In"}
        </button>
        <p className="mob-register">
          New restaurant?{" "}
          <button type="button" onClick={() => navigate("/register")} className="mob-reg-link">
            Register here
          </button>
        </p>
      </form>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function RestaurantLogin() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [loginError, setLoginError]       = useState("");

  useKeyboard({ onEscape: () => {} }, [], true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const session = localStorage.getItem("myezz_session");
    if (session) {
      const { restaurantId } = JSON.parse(session);
      navigate(`/${restaurantId}/orders`);
    }
  }, [navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Login failed");
      localStorage.setItem("myezz_session", JSON.stringify({
        restaurantId: data.data.restaurantId,
        restaurantName: data.data.restaurantName,
        username: data.data.username,
      }));
      navigate(`/${data.data.restaurantId}/orders`);
    } catch (err) {
      setLoginError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div className="login-page">
        <ArtisticBackground />
        <MobileView {...{ loginEmail, setLoginEmail, loginPassword, setLoginPassword,
          showPassword, setShowPassword, loginError, isLoading, handleSignIn, navigate }} />
      </div>
    );
  }

  return (
    <div className="login-page">
      <ArtisticBackground />

      <div className="login-main">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
        {/* ── Left: Form ── */}
        <section className="login-left">
          <img src="/Myezz_logo.svg" alt="MyEzz" className="login-logo" />
          <h1 className="login-heading">Welcome Back, Partner</h1>
          <p className="login-subtext">Manage your kitchen operations effortlessly.</p>

          <form className="login-form" onSubmit={handleSignIn}>
            <div className="lf-field">
              <input
                id="login-email"
                type="text"
                placeholder="Email / Username"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="lf-field lf-pw">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button" className="eye-btn"
                onClick={() => setShowPassword(p => !p)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="lf-extras">
              <label className="lf-remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>

            {loginError && (
              <motion.p
                className="lf-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {loginError}
              </motion.p>
            )}

            <motion.button
              type="submit"
              className="signin-btn"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {isLoading ? <Loader2 size={20} className="spin-anim" /> : "Sign In"}
            </motion.button>
          </form>

          <p className="lf-register">
            New restaurant?{" "}
            <button type="button" className="reg-link-btn" onClick={() => navigate("/register")}>
              Register here
            </button>
          </p>
        </section>

        {/* Divider */}
        <div className="login-divider-line" />

        {/* ── Right: Illustration ── */}
        <section className="login-right">
          <div className="illus-wrap">
            <img src="/login.png" alt="Restaurant partner" className="chef-img" />
            <SalesCard />
            <OrdersCard />
            <EfficiencyCard />
          </div>
        </section>
        </motion.div>
      </div>{/* /login-main */}

      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-brand">
          <img src="/Myezz_logo.svg" alt="MyEzz" className="footer-logo" />
        </div>
        <div className="footer-links">
          <a href="https://my-ezz.vercel.app/" target="_blank" rel="noopener noreferrer">
            MyEzz
          </a>
          <a href="https://myezzofficial.netlify.app/about" target="_blank" rel="noopener noreferrer">
            About
          </a>
          <a href="https://myezzofficial.netlify.app/contact" target="_blank" rel="noopener noreferrer">
            Contact
          </a>
        </div>
        <div className="footer-social">
          <a href="https://www.instagram.com/mycravezz/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={17} /></a>
          <a href="tel:+918097021356" aria-label="Phone"><Phone size={17} /></a>
          <a href="mailto:myeasycheckout@gmail.com" aria-label="Email"><Mail size={17} /></a>
        </div>
        <p className="footer-copy">© 2026 MyEzz Partner. All rights reserved.</p>
      </footer>
    </div>
  );
}