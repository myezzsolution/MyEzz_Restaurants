import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CircleCheck,
  TrendingUp,
  Smartphone,
  Banknote,
  FileText,
  Upload,
  Rocket,
} from 'lucide-react';
import styles from './Register.module.css';

const DOCUMENTS = [
  'PAN Card',
  'FSSAI License',
  'GST (if applicable)',
  'Bank Account Details',
  'Menu & Food Images',
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Higher Profit Margins',
    description:
      'Keep more of what you earn — no hidden fees, no surprises.',
  },
  {
    icon: Smartphone,
    title: 'Smart Order Management',
    description:
      'Real-time dashboard to manage orders, track prep times, and stay on top of peak hours.',
  },
  {
    icon: Banknote,
    title: 'Fast Payouts',
    description:
      'Daily settlement cycles. Your earnings hit your bank account without delays.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function Register() {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/onboarding');
  };

  return (
    <div className={styles.page}>
      {/* ===== SECTION 1 — HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />

        <nav className={styles.topBar}>
          <img
            src="/Myezz_logo.svg"
            alt="MyEzz"
            className={styles.logo}
            onClick={() => navigate('/')}
          />
          <button
            className={styles.loginBtn}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </nav>

        <div className={styles.heroInner}>
          <motion.h1
            className={styles.headline}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Partner with MyEzz and Grow Your Restaurant Business
          </motion.h1>

          <motion.button
            className={styles.heroCta}
            onClick={handleRegisterClick}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Register Your Restaurant
          </motion.button>

          <motion.span
            className={styles.helperText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Takes less than 10 minutes to complete
          </motion.span>
        </div>
      </section>

      {/* ===== SECTION 2 — GET STARTED CARD ===== */}
      <section className={styles.getStarted}>
        <motion.div
          className={styles.glassCard}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
        >
          <div className={styles.cardLeft}>
            <h2 className={styles.cardTitle}>
              Get Started in Just 3 Easy Steps
            </h2>
            <p className={styles.cardSubtitle}>Keep these documents handy:</p>
            <ul className={styles.checklist}>
              {DOCUMENTS.map((doc) => (
                <li key={doc} className={styles.checkItem}>
                  <CircleCheck size={20} className={styles.checkIcon} />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.cardRight}>
            <div className={styles.stepsContainer}>
              <div className={styles.stepItem}>
                <div className={styles.stepIconBox}>
                  <FileText size={24} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepLabel}>Step 1</span>
                  <span className={styles.stepText}>Submit basic details</span>
                </div>
              </div>
              
              <div className={styles.stepLine} />

              <div className={styles.stepItem}>
                <div className={styles.stepIconBox}>
                  <Upload size={24} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepLabel}>Step 2</span>
                  <span className={styles.stepText}>Upload documents</span>
                </div>
              </div>

              <div className={styles.stepLine} />

              <div className={styles.stepItem}>
                <div className={styles.stepIconBox}>
                  <Rocket size={24} />
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepLabel}>Step 3</span>
                  <span className={styles.stepText}>Go live in 48 hours</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== SECTION 3 — WHY PARTNER ===== */}
      <section className={styles.whyPartner}>
        <motion.h2
          className={styles.sectionTitle}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          Why Partner with MyEzz
        </motion.h2>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className={styles.featureCard}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              custom={i}
              variants={fadeUp}
            >
              <div className={styles.featureIcon}>
                <f.icon size={26} />
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== SECTION 4 — CTA STRIP ===== */}
      <section className={styles.ctaStrip}>
        <motion.div
          className={styles.ctaInner}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className={styles.ctaHeadline}>Ready to grow with MyEzz?</h2>
          <motion.button
            className={styles.ctaBtn}
            onClick={handleRegisterClick}
            whileTap={{ scale: 0.97 }}
          >
            Start Growing Today
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
}
