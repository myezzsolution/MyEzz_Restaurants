import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Upload,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import styles from './RegistrationWizard.module.css';

const TOTAL_STEPS = 4;

const DOCUMENTS_REQUIRED = [
  'PAN Card',
  'FSSAI License',
  'Bank Account Details',
  'GST (if applicable)',
  'Menu Images',
];

// Only these MIME types are accepted for document uploads
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_LABEL = 'PDF, JPG, or PNG';

export default function RegistrationWizard() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    restaurantName: '',
    cuisineType: '',
    address: '',
    primaryContact: '',
    ownerName: '',
    email: '',
    password: '',
    ownerPhone: '',
    whatsappUpdates: true,
    agreeTerms: false,
  });

  // uploadedFiles stores { file: File, preview: boolean } per key
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const handleFileSelect = (key, file) => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      setUploadErrors(prev => ({
        ...prev,
        [key]: `Invalid file type. Please upload a ${ACCEPTED_LABEL} file.`,
      }));
      return;
    }
    // Clear any previous error for this slot
    setUploadErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setUploadedFiles(prev => ({ ...prev, [key]: { file } }));
  };

  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.restaurantName &&
        formData.cuisineType &&
        formData.address &&
        formData.primaryContact.length >= 10
      );
    }
    if (step === 2) {
      return (
        formData.ownerName &&
        formData.email &&
        formData.password &&
        formData.ownerPhone.length >= 10
      );
    }
    if (step === 3) {
      return true; // uploads are optional
    }
    if (step === 4) {
      return formData.agreeTerms;
    }
    return false;
  };

  const handleNext = () => {
    if (!isStepValid()) {
      // Surface validation inline via submitError field (step-level)
      const msg =
        step === 1
          ? 'Please fill all fields. Phone number must be at least 10 digits.'
          : 'Please fill all required fields. Phone number must be at least 10 digits.';
      setSubmitError(msg);
      return;
    }
    setSubmitError(null);
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    setSubmitError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubmitError(null);

    if ((name === 'primaryContact' || name === 'ownerPhone') && type !== 'checkbox') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggle = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Upload a single file via the backend (service role bypasses RLS)
  const uploadDoc = async (key) => {
    const entry = uploadedFiles[key];
    if (!entry) return null;

    const formPayload = new FormData();
    formPayload.append('file', entry.file);
    formPayload.append('docKey', key);
    formPayload.append('restaurantName', formData.restaurantName);

    const res = await fetch('http://localhost:3001/api/upload-doc', {
      method: 'POST',
      body: formPayload,
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(`Failed to upload ${key}: ${error}`);
    }

    const { path } = await res.json();
    return path;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStepValid()) {
      setSubmitError('Please agree to the terms & conditions.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Upload documents (parallel where they exist)
      const [docPan, docFssai, docGst, docBank] = await Promise.all([
        uploadDoc('pan'),
        uploadDoc('fssai'),
        uploadDoc('gst'),
        uploadDoc('bank'),
      ]);

      // 2. Insert application row — password is intentionally excluded
      const { error: insertError } = await supabase
        .from('restaurant_applications')
        .insert({
          restaurant_name:  formData.restaurantName,
          cuisine_type:     formData.cuisineType,
          address:          formData.address,
          primary_contact:  formData.primaryContact,
          owner_name:       formData.ownerName,
          email:            formData.email,
          owner_phone:      formData.ownerPhone,
          whatsapp_updates: formData.whatsappUpdates,
          doc_pan:          docPan,
          doc_fssai:        docFssai,
          doc_gst:          docGst,
          doc_bank:         docBank,
          status:           'pending',
        });

      if (insertError) throw new Error(insertError.message);

      // 3. Done — redirect to login
      navigate('/login');

    } catch (err) {
      console.error('Registration submit failed:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>

      {/* ===== 1. ENTRY MODAL ===== */}
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
                <p className={styles.modalSubtitle}>
                  Keep these documents handy for a smooth registration
                </p>
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
                  Got It, Let&#39;s Continue
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
          <a href="#" className={styles.helpLink}>
            Need Help? <span style={{ color: '#94A3B8' }}>|</span> +91 80970 21356
          </a>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.stepIndicator}>
            <span className={styles.activeStepText}>Step {step} of {TOTAL_STEPS}</span>
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

              {/* STEP 1 */}
              {step === 1 && (
                <div className={styles.formGrid}>
                  <InputGroup
                    label="Restaurant Name"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    placeholder="e.g. Spice Garden"
                  />
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
                    <label className={styles.label}>Full Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`${styles.input} ${styles.textarea}`}
                      placeholder="Shop No, Street, Landmark..."
                    />
                  </div>
                  <InputGroup
                    label="Primary Contact Number"
                    name="primaryContact"
                    value={formData.primaryContact}
                    onChange={handleChange}
                    placeholder="9876543210"
                    type="tel"
                    subtext="10-digit mobile number"
                  />
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className={styles.formGrid}>
                  <InputGroup label="Full Name" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Rahul Sharma" />
                  <InputGroup label="Email Address" name="email" value={formData.email} onChange={handleChange} placeholder="rahul@example.com" type="email" />
                  <InputGroup label="Create Password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" type="password" />
                  <InputGroup
                    label="Phone Number"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    type="tel"
                    subtext="This number will be visible to customers."
                  />
                  <div className={styles.toggleRow} onClick={() => handleToggle('whatsappUpdates')}>
                    <span className={styles.toggleLabel}>Receive updates on WhatsApp</span>
                    <div className={styles.toggleSwitch} data-active={formData.whatsappUpdates}>
                      <div className={styles.toggleKnob} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className={styles.uploadGrid}>
                  <UploadBox
                    label="PAN Card"
                    fileKey="pan"
                    entry={uploadedFiles.pan}
                    error={uploadErrors.pan}
                    onFileSelect={handleFileSelect}
                  />
                  <UploadBox
                    label="FSSAI License"
                    fileKey="fssai"
                    entry={uploadedFiles.fssai}
                    error={uploadErrors.fssai}
                    onFileSelect={handleFileSelect}
                  />
                  <UploadBox
                    label="GST Registration"
                    sub="(Optional)"
                    fileKey="gst"
                    entry={uploadedFiles.gst}
                    error={uploadErrors.gst}
                    onFileSelect={handleFileSelect}
                  />
                  <UploadBox
                    label="Bank Account Proof"
                    fileKey="bank"
                    entry={uploadedFiles.bank}
                    error={uploadErrors.bank}
                    onFileSelect={handleFileSelect}
                  />
                  <div className={styles.secureNote}>
                    <Lock size={14} color="#16A34A" />
                    <span>All documents are encrypted and stored securely. Accepts {ACCEPTED_LABEL}.</span>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className={styles.formGrid}>
                  <div className={styles.reviewCard}>
                    <ReviewRow label="Restaurant Name" value={formData.restaurantName} />
                    <ReviewRow label="Cuisine" value={formData.cuisineType} />
                    <ReviewRow label="Address" value={formData.address} />
                    <ReviewRow label="Owner Name" value={formData.ownerName} />
                    <ReviewRow label="Email" value={formData.email} />
                    <ReviewRow label="Contact" value={formData.ownerPhone} />
                    <ReviewRow
                      label="Documents"
                      value={
                        Object.keys(uploadedFiles).length > 0
                          ? `${Object.keys(uploadedFiles).length} file(s) ready`
                          : 'None uploaded'
                      }
                    />
                  </div>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                    />
                    <span className={styles.checkboxText}>
                      I agree to MyEzz partner terms &amp; conditions
                    </span>
                  </label>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Inline error */}
          {submitError && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className={styles.spinnerIcon} />
                  Submitting...
                </>
              ) : step === 4 ? (
                'SUBMIT DETAILS'
              ) : (
                <>Continue <ArrowRight size={18} /></>
              )}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

// ===== Sub-components =====

function InputGroup({ label, name, value, onChange, placeholder, type = 'text', subtext }) {
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
        autoComplete="off"
      />
      {subtext && (
        <span style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '-0.25rem' }}>
          {subtext}
        </span>
      )}
    </div>
  );
}

function UploadBox({ label, sub, fileKey, entry, error, onFileSelect }) {
  const isUploaded = !!entry;

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(fileKey, e.target.files[0]);
    }
  };

  const triggerPicker = () => {
    document.getElementById(`file-${fileKey}`).click();
  };

  return (
    <div>
      <div
        className={`${styles.uploadBox} ${isUploaded ? styles.uploaded : ''}`}
        onClick={triggerPicker}
      >
        <input
          type="file"
          id={`file-${fileKey}`}
          style={{ display: 'none' }}
          accept="application/pdf,image/jpeg,image/png"
          onChange={handleChange}
        />
        {isUploaded ? (
          <CheckCircle2 size={32} className={styles.uploadIcon} />
        ) : (
          <Upload size={32} className={styles.uploadIcon} />
        )}
        <div>
          <div className={styles.uploadLabel}>{label}</div>
          {isUploaded ? (
            <div className={styles.uploadSub} style={{ color: '#22C55E' }}>
              {entry.file.name} &nbsp;·&nbsp;
              <span
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); triggerPicker(); }}
              >
                Change
              </span>
            </div>
          ) : (
            <div className={styles.uploadSub}>{sub || 'PDF, JPG, or PNG'}</div>
          )}
        </div>
      </div>
      {error && (
        <p style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className={styles.reviewRow}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value || '—'}</span>
    </div>
  );
}

function getStepTitle(step) {
  switch (step) {
    case 1: return 'Tell us about your restaurant';
    case 2: return 'Owner & Contact Information';
    case 3: return 'Upload Required Documents';
    case 4: return 'Review & Submit';
    default: return '';
  }
}

function getStepSubtext(step) {
  switch (step) {
    case 1: return 'Takes less than 2 minutes';
    case 2: return "We'll use this to create your account";
    case 3: return 'Verify your business identity';
    case 4: return 'Almost done! Confirm your details';
    default: return '';
  }
}
