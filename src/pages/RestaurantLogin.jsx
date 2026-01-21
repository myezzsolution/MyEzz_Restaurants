//src/pages/RestaurantLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RestaurantLogin.css";
import { login } from "../services/authService";

export default function RestaurantLogin() {
  const [isActive, setIsActive] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const wrapperStyle = {
    backgroundColor: "#c9d6ff",
    backgroundImage: "linear-gradient(to right, #e2e2e2, #c9d6ff)",
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
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    padding: "0 40px",
    height: "100%"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await login({ email, password });
      console.log("Logged in:", res.user);

      navigate("/orders");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      <div className={`container ${isActive ? "active" : ""}`}>

        {}
        <div className="form-container sign-up">
          <form style={formBaseStyle}>
            <h1 className="title">Create Account</h1>

            <span>or use your email for registration</span>

            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />

            <button type="button" className="btn-main">
              Sign Up
            </button>
          </form>
        </div>

        {}
        <div className="form-container sign-in">
          <form style={formBaseStyle} onSubmit={handleSubmit}>
            <h1 className="title">Sign In</h1>

            <span>or use your email password</span>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <a href="#" className="forgot">
              Forgot Your Password?
            </a>

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

            <button type="submit" className="btn-main" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        {}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Already have an account?</p>
              <button className="hidden" onClick={() => setIsActive(false)}>
                Sign In
              </button>
            </div>

            <div className="toggle-panel toggle-right">
              <h1>Hello, Welcome!</h1>
              <p>Don't have an account?</p>
              <button className="hidden" onClick={() => setIsActive(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
