import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessToast from '../../components/ui/SuccessToast';
import {
  ChefHat,
  Bike,
  ChevronRight,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Menu as MenuIcon,
  Instagram,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react';
import styles from './Landing.module.css';

const ROTATING_WORDS = ['effortlessly', 'profitably', 'securely', 'efficiently'];

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast Orders',
    description: 'Process orders in real-time with our optimized dashboard. Never miss a beat during peak hours.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Analytics',
    description: 'Track your performance with detailed insights. Make data-driven decisions to grow your business.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security for your business. Your data is protected with industry-leading encryption.',
  },
  {
    icon: Clock,
    title: 'Real-time Updates',
    description: 'Stay connected with instant notifications. Keep your customers informed every step of the way.',
  },
  {
    icon: ChefHat,
    title: 'Menu Management',
    description: 'Easily update your menu, prices, and availability. Full control at your fingertips.',
  },
  {
    icon: Bike,
    title: 'Delivery Integration',
    description: 'Seamless integration with delivery partners. Optimize routes and reduce delivery times.',
  },
];

const STATS = [
  { number: '30+', label: 'Trusted Local Partners' },
  { number: '100%', label: 'Hyper-Local Support' },
  { number: 'Daily', label: 'Instant Payout Cycles' },
];

function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [wordIndex, setWordIndex] = useState(0);
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  useEffect(() => {
    if (location.state?.showLogoutToast) {
      setShowLogoutToast(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className={styles.landingPage}>
      {/* Success Toast for Logout */}
      {showLogoutToast && (
        <SuccessToast 
          message="Logged out successfully"
          duration={4000}
          isVisible={showLogoutToast}
          onClose={() => setShowLogoutToast(false)}
        />
      )}
      {/* Film Grain Noise Overlay */}
      <div className={styles.noiseOverlay} />

      {/* Background Gradient */}
      <div className={styles.backgroundGradient} />

      {/* Watermark Vectors */}
      <ChefHat
        className={`${styles.watermarkIcon} ${styles.watermarkTopLeft}`}
        size={350}
        strokeWidth={0.5}
      />
      <Bike
        className={`${styles.watermarkIcon} ${styles.watermarkBottomRight}`}
        size={350}
        strokeWidth={0.5}
      />

      {/* Glass Navbar */}
      <nav className={styles.glassNavbar}>
        <div className={styles.navContent}>
          <div className={styles.logo} onClick={() => navigate('/landing')}>
            <img
              src="/myezzlogopage0001removebgpreview1338-07fh-400h.png"
              alt="MyEzz Partner"
              className={styles.logoImage}
            />
          </div>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#stats" className={styles.navLink}>Stats</a>
            <button className={styles.navButton} onClick={handleSignIn}>
              Sign In
            </button>
          </div>
          <button className={styles.mobileMenuBtn} aria-label="Menu">
            <MenuIcon size={24} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            <span className={styles.headlineStatic}>Scale your kitchen</span>
            <span className={styles.headlineAnimated}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  className={styles.animatedWord}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                  }}
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className={styles.heroSubtitle}>
            Stop juggling apps and start scaling. Join an exclusive circle of local
            partners using MyEzz to streamline every order, from prep to dispatch,
            with real-time insights designed for the modern Indian kitchen.
          </p>
          <motion.button
            className={styles.ctaButton}
            onClick={handleGetStarted}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.ctaButtonText}>Get Started</span>
            <span className={styles.ctaIconWrapper}>
              <ChevronRight className={styles.ctaIcon} size={20} strokeWidth={2.5} />
            </span>
          </motion.button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className={styles.featureIcon}>
                <feature.icon size={28} />
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className={styles.statsSection}>
        {/* Orange Radial Glow */}
        <div className={styles.statsGlow} />
        <div className={styles.statsGrid}>
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              className={styles.statItem}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          {/* Footer Top Section */}
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <img
                src="/myezzlogopage0001removebgpreview1338-07fh-400h.png"
                alt="MyEzz Partner"
                className={styles.footerLogo}
              />
              <p className={styles.footerDescription}>
                Empowering local kitchens with smart technology.
                Scale your business effortlessly with MyEzz Partner.
              </p>
            </div>

            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>Features</h4>
                <ul className={styles.footerLinkList}>
                  <li><a href="#features" className={styles.footerLink}>Lightning Fast Orders</a></li>
                  <li><a href="#features" className={styles.footerLink}>Smart Analytics</a></li>
                  <li><a href="#features" className={styles.footerLink}>Menu Management</a></li>
                  <li><a href="#features" className={styles.footerLink}>Real-time Updates</a></li>
                </ul>
              </div>

              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>Company</h4>
                <ul className={styles.footerLinkList}>
                  <li>
                    <a
                      href="https://my-ezz.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.footerLink}
                    >
                      MyEzz Official <ExternalLink size={14} />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://myezzofficial.netlify.app/about"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.footerLink}
                    >
                      About Us <ExternalLink size={14} />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://myezzofficial.netlify.app/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.footerLink}
                    >
                      Contact <ExternalLink size={14} />
                    </a>
                  </li>
                </ul>
              </div>

              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>Connect</h4>
                <div className={styles.socialContactGrid}>
                  <a
                    href="https://www.instagram.com/mycravezz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialContactLink}
                    aria-label="Follow us on Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="tel:+918097021356"
                    className={styles.socialContactLink}
                    aria-label="Call us"
                  >
                    <Phone size={20} />
                  </a>
                  <a
                    href="mailto:myeasycheckout@gmail.com"
                    className={styles.socialContactLink}
                    aria-label="Email us"
                  >
                    <Mail size={20} />
                  </a>
                </div>
                <div className={styles.contactDetails}>
                  <p className={styles.contactText}>+91 80970 21356</p>
                  <p className={styles.contactText}>myeasycheckout@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom Section */}
          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              © 2026 <span className={styles.footerBrandName}>MyEzz Partner</span>. All rights reserved.
            </p>
            <div className={styles.footerBottomLinks}>
              <a href="#" className={styles.footerBottomLink}>Privacy Policy</a>
              <a href="#" className={styles.footerBottomLink}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
