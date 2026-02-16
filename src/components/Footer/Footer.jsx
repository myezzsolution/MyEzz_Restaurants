import { Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';
import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.left}>
          <img 
            src="/Myezz_logo.svg" 
            alt="MyEzz" 
            className={styles.logo}
          />
          <span className={styles.copyright}>
            © 2026 MyEzz. All rights reserved.
          </span>
        </div>
        
        <div className={styles.right}>
          <a 
            href="https://myezz.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            myezz.in
          </a>
          <div className={styles.socials}>
            <a href="https://instagram.com/myezz" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <Instagram size={18} />
            </a>
            <a href="https://twitter.com/myezz" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <Twitter size={18} />
            </a>
            <a href="https://facebook.com/myezz" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <Facebook size={18} />
            </a>
            <a href="https://linkedin.com/company/myezz" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
