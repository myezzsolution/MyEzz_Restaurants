import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Upload, 
  Building2, 
  User, 
  FileText, 
  CheckSquare,
  Lock
} from 'lucide-react';
import styles from './RegistrationWizard.module.css';

const TOTAL_STEPS = 4;

const DOCUMENTS_REQUIRED = [
  'PAN Card',
  'FSSAI License',
  'Bank Account Details',
  'GST (if applicable)',
  'Menu Images',
];

export default function RegistrationWizard() {
  const [showModal, setShowModal] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    restaurantName: '',
    cuisineType: '',
    city: '',
    address: '',
    primaryContact: '',
    ownerName: '',
    email: '',
    password: '', // Added for account creation
    ownerPhone: '',
    whatsappUpdates: true,
    agreeTerms: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState({});

  const handleUpload = (key) => {
    // Mock upload delay
    setTimeout(() => {
      setUploadedFiles(prev => ({ ...prev, [key]: true }));
    }, 500);
  };

  // Simple validation check for current step
  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.restaurantName &&
        formData.cuisineType &&
        formData.city &&
        formData.address &&
        formData.primaryContact
      );
    }
    if (step === 2) {
      return (
        formData.ownerName &&
        formData.email &&
        formData.password &&
        formData.ownerPhone
      );
    }
    if (step === 3) {
      return true; // Uploads are optional in this frontend demo or we assume they did it
    }
    if (step === 4) {
      return formData.agreeTerms;
    }
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Numeric validation for phone fields
    if ((name === 'primaryContact' || name === 'ownerPhone') && type !== 'checkbox') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggle = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Registration Submitted! Welcome to MyEzz.');
    // Here you would integrate Supabase signup logic
  };

  return (
    <div className={styles.pageContainer}>
      
      {/* ===== 1. MODAL ===== */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Be Ready Before You Start</h2>
                <p className={styles.modalSubtitle}>Keep these documents handy for a smooth registration</p>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.checklist}>
                  {DOCUMENTS_REQUIRED.map(doc => (
                    <div key={doc} className={styles.checkItem}>
                      <CheckCircle2 size={20} className={styles.checkIcon} />
                      <span className={styles.checkText}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.modalBtn}
                  onClick={() => setShowModal(false)}
                >
                  Got It, Let’s Continue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 2. WIZARD CARD ===== */}
      <motion.div 
        className={styles.wizardCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Top Bar */}
        <div className={styles.topBar}>
          <img src="/Myezz_logo.svg" alt="MyEzz" className={styles.logo} />
          <a href="#" className={styles.helpLink}>Need Help? <span style={{color:'#94A3B8'}}>|</span> +91 80970 21356</a>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.stepIndicator}>
            <span className={styles.activeStepText}>Step {step} of 4</span>
            <span>{getStepTitle(step)}</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%' }}
            >
              <h1 className={styles.stepTitle}>{getStepTitle(step)}</h1>
              <p className={styles.stepSubtext}>{getStepSubtext(step)}</p>

              {/* STEP 1: Restaurant Details */}
              {step === 1 && (
                <div className={styles.formGrid}>
                  <InputGroup label="Restaurant Name" name="restaurantName" value={formData.restaurantName} onChange={handleChange} placeholder="e.g. Spice Garden" />
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Cuisine Type</label>
                    <select 
                      name="cuisineType" 
                      value={formData.cuisineType} 
                      onChange={handleChange}
                      className={styles.input}
                    >
                      <option value="">Select Cuisine</option>
                      <option value="North Indian">North Indian</option>
                      <option value="South Indian">South Indian</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Italian">Italian</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Multi-Cuisine">Multi-Cuisine</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>City</label>
                    <select 
                      name="city" 
                      value={formData.city} 
                      onChange={handleChange}
                      className={styles.input}
                    >
                      <option value="">Select City</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Pune">Pune</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Full Address</label>
                    <textarea 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange}
                      className={`${styles.input} ${styles.textarea}`}
                      placeholder="Shop No, Street, Landmark..."
                    />
                  </div>

                  <InputGroup label="Primary Contact Number" name="primaryContact" value={formData.primaryContact} onChange={handleChange} placeholder="+91 98765 43210" type="tel" />
                </div>
              )}

              {/* STEP 2: Owner Details */}
              {step === 2 && (
                <div className={styles.formGrid}>
                  <InputGroup label="Full Name" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Rahul Sharma" />
                  <InputGroup label="Email Address" name="email" value={formData.email} onChange={handleChange} placeholder="rahul.sharma@example.com" type="email" />
                  <InputGroup label="Create Password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" type="password" />
                  <InputGroup label="Phone Number" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} placeholder="+91 98765 43210" type="tel" subtext="This number will be visible to customers." />
                  
                  <div className={styles.toggleRow} onClick={() => handleToggle('whatsappUpdates')}>
                    <span className={styles.toggleLabel}>Receive updates on WhatsApp</span>
                    <div className={styles.toggleSwitch} data-active={formData.whatsappUpdates}>
                      <div className={styles.toggleKnob} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Documents */}
              {step === 3 && (
                <div className={styles.uploadGrid}>
                  <UploadBox label="PAN Card" fileKey="pan" isUploaded={uploadedFiles.pan} onUpload={handleUpload} />
                  <UploadBox label="FSSAI License" fileKey="fssai" isUploaded={uploadedFiles.fssai} onUpload={handleUpload} />
                  <UploadBox label="GST Registration" sub="(Optional)" fileKey="gst" isUploaded={uploadedFiles.gst} onUpload={handleUpload} />
                  <UploadBox label="Bank Account Proof" fileKey="bank" isUploaded={uploadedFiles.bank} onUpload={handleUpload} />
                  <div style={{gridColumn: '1 / -1', textAlign: 'center', marginTop: '1rem', color:'#64748B', fontSize: '0.9rem', display:'flex', justifyContent:'center', gap:'0.5rem', alignItems:'center'}}>
                     <Lock size={16} color="#16A34A" /> All documents are encrypted and stored securely.
                  </div>
                </div>
              )}

              {/* STEP 4: Review */}
              {step === 4 && (
                <div className={styles.formGrid}>
                   <div className={styles.reviewCard}>
                     <ReviewRow label="Restaurant Name" value={formData.restaurantName} />
                     <ReviewRow label="Cuisine" value={formData.cuisineType} />
                     <ReviewRow label="City" value={formData.city} />
                     <ReviewRow label="Owner Name" value={formData.ownerName} />
                     <ReviewRow label="Contact" value={formData.ownerPhone} />
                   </div>
                   
                   <label className={styles.checkboxRow}>
                     <input 
                       type="checkbox" 
                       className={styles.checkbox}
                       name="agreeTerms"
                       checked={formData.agreeTerms}
                       onChange={handleChange}
                     />
                     <span className={styles.checkboxText}>I agree to MyEzz partner terms & conditions</span>
                   </label>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Bottom Actions */}
          <div className={styles.buttonGroup}>
            <button 
              className={styles.backBtn} 
              onClick={handleBack}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              Back
            </button>
            <button 
              className={styles.continueBtn} 
              onClick={step === 4 ? handleSubmit : handleNext}
              disabled={!isStepValid()}
            >
              {step === 4 ? 'SUBMIT DETAILS' : 'Continue'}
              {step !== 4 && <ArrowRight size={18} />}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

// Helpers
function InputGroup({ label, name, value, onChange, placeholder, type = "text", subtext }) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{label}</label>
      <input 
        type={type} 
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={styles.input}
      />
      {subtext && <span style={{fontSize: '0.8rem', color: '#64748B', marginTop: '-0.25rem'}}>{subtext}</span>}
    </div>
  );
}

function UploadBox({ label, sub, fileKey, isUploaded, onUpload }) {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(fileKey);
    }
  };

  return (
    <div 
      className={`${styles.uploadBox} ${isUploaded ? styles.uploaded : ''}`}
      onClick={() => !isUploaded && document.getElementById(`file-${fileKey}`).click()}
    >
      <input 
        type="file" 
        id={`file-${fileKey}`} 
        style={{display: 'none'}} 
        onChange={handleFileChange} 
      />
      {isUploaded ? (
        <CheckCircle2 size={32} className={styles.uploadIcon} />
      ) : (
        <Upload size={32} className={styles.uploadIcon} />
      )}
      <div>
        <div className={styles.uploadLabel}>{label}</div>
        {isUploaded ? (
          <div className={styles.uploadSub} style={{color: '#22C55E'}}>
            Uploaded • <span style={{textDecoration:'underline', cursor:'pointer'}} onClick={(e) => { 
              e.stopPropagation(); 
              document.getElementById(`file-${fileKey}`).click(); 
            }}>Change</span>
          </div>
        ) : (
          sub && <div className={styles.uploadSub}>{sub}</div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className={styles.reviewRow}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value}</span>
    </div>
  );
}

function getStepTitle(step) {
  switch (step) {
    case 1: return "Tell us about your restaurant";
    case 2: return "Owner & Contact Information";
    case 3: return "Upload Required Documents";
    case 4: return "Review & Submit";
    default: return "";
  }
}

function getStepSubtext(step) {
  switch (step) {
    case 1: return "Takes less than 2 minutes";
    case 2: return "We’ll use this to create your account";
    case 3: return "Verify your business identity";
    case 4: return "Almost done! Confirm your details";
    default: return "";
  }
}
