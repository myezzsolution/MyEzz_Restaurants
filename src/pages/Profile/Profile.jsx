import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '../../context/RestaurantContext';
import { updateRestaurant } from '../../services/menuService';
import { 
  UtensilsCrossed,
  Copy,
  ShieldCheck,
  Building2,
  Landmark,
  CreditCard,
  Calendar,
  IndianRupee,
  Bell,
  Volume2,
  Bike,
  Phone,
  Lock,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Pencil,
  CheckCircle,
  Store,
  Camera
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import useKeyboard from '../../hooks/useKeyboard';
import ToastSave from '../../components/ui/ToastSave';
import SuccessToast from '../../components/ui/SuccessToast';
import styles from './Profile.module.css';

const Profile = () => {
  const navigate = useNavigate();
  const { isOnline, setOnlineStatus, toggleProfile } = useRestaurant();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toastState, setToastState] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    orderSound: true,
    riderAlerts: true
  });

  // Fetch restaurant data from context
  const { restaurantData, refetchRestaurant, isLoading, restaurantId } = useRestaurant();
  // ... existing state ...

  // Use real data or fallback to defaults if loading/missing
  const currentData = restaurantData || {};

  // Default values matching DB schema or reasonable fallbacks
  const displayData = {
    name: currentData.name || 'Loading...',
    businessName: currentData.business_name || currentData.name || 'Not Available',
    gstin: currentData.gstin || 'Not Available',
    partnerId: `MEZ-${(currentData.id || 0).toString().padStart(3, '0')}`,
    isVerified: true,
    bankAccount: currentData.bank_account || 'Not Available',
    ifscCode: currentData.ifsc_code || 'Not Available',
    bankName: currentData.bank_name || 'Not Available',
    payoutCycle: 'Daily Settlements', // Hardcoded for now as not in DB
    weeklyEarnings: 0, // Not in DB yet
    categories: ['Multi-Cuisine'], // Default
    logoInitial: (currentData.name || 'R').substring(0, 2).toUpperCase()
  };

  // Editable fields state
  const [editableData, setEditableData] = useState({
    name: displayData.name,
    businessName: displayData.businessName,
    gstin: displayData.gstin
  });

  // Store original editable data for comparison
  const [originalEditableData, setOriginalEditableData] = useState({
    name: displayData.name,
    businessName: displayData.businessName,
    gstin: displayData.gstin
  });

  // Keyboard navigation
  useKeyboard({
    onEscape: () => {
      // Logic from handleCloseProfile
      if (isEditing && hasChanges()) {
        setToastState('initial');
      } else {
        toggleProfile(false);
      }
    }
  }, [isEditing, editableData, originalEditableData, toastState], true);

  // Sync state when data loads
  useEffect(() => {
    if (restaurantData) {
        const newData = {
            name: restaurantData.name || '',
            businessName: restaurantData.business_name || restaurantData.name || '',
            gstin: restaurantData.gstin || ''
        };
        setEditableData(newData);
        setOriginalEditableData(newData);
    }
  }, [restaurantData]);

  // Check if data has changed
  const hasChanges = useCallback(() => {
    return editableData.name !== originalEditableData.name ||
           editableData.businessName !== originalEditableData.businessName ||
           editableData.gstin !== originalEditableData.gstin;
  }, [editableData, originalEditableData]);

  // Show toast when there are unsaved changes
  useEffect(() => {
    if (isEditing && hasChanges()) {
      setToastState('initial');
    } else if (toastState === 'initial') {
      setToastState(null);
    }
  }, [editableData, isEditing, hasChanges, toastState]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContactSupport = () => {
    window.open('https://wa.me/918097021356?text=Hi%20MyEzz%20Support', '_blank');
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }

    setToastState('loading');
    
    try {
      // Prepare data for API
      const updateData = {
        name: editableData.name,
        business_name: editableData.businessName,
        gstin: editableData.gstin
      };

      await updateRestaurant(updateData, restaurantId);
      
      // Update local state and refetch
      setOriginalEditableData({ ...editableData });
      await refetchRestaurant();
      
      setToastState(null);
      setIsEditing(false);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Ideally show error toast here, but for now reset toast state or show error state
      setToastState(null); 
      // You might want to keep isEditing true so user can try again
      alert('Failed to save changes. Please try again.');
    }
  };
 
  const handleReset = () => {
    setEditableData({ ...originalEditableData });
    setToastState(null);
  };

  const handleCloseProfile = () => {
    if (hasChanges()) {
      // If there are unsaved changes, show the toast
      setToastState('initial');
      return;
    }
    toggleProfile(false);
  };

  const handleLogout = () => {
    // Clear the session from localStorage
    localStorage.removeItem('myezz_session');
    // Navigate to landing page with a state flag to show toast
    navigate('/', { state: { showLogoutToast: true } });
  };

  // Merge editable data with original data
  // Merge editable data with original data
  const restaurantDataMerged = {
    ...displayData,
    name: editableData.name,
    businessName: editableData.businessName,
    gstin: editableData.gstin
  };

  return (
    <>
      {/* Backdrop overlay with centered Profile Card */}
      <motion.div 
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCloseProfile}
      >
        {/* Profile Card */}
        <motion.div 
          className={styles.profileCard}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside card
        >
        {/* Card Header with Close & Edit */}
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Profile</h2>
          <div className={styles.headerActions}>
            {!isEditing ? (
              <button 
                className={styles.editBtn}
                onClick={handleEditClick}
                aria-label="Edit profile"
              >
                <Pencil />
                <span>Edit</span>
              </button>
            ) : (
              <button 
                className={styles.saveEditBtn}
                onClick={handleSave}
                aria-label="Save changes"
              >
                <CheckCircle />
                <span>Done</span>
              </button>
            )}
            <button 
              className={styles.closeBtn}
              onClick={handleCloseProfile}
              aria-label="Close profile"
            >
              <X />
            </button>
          </div>
        </div>

        <div className={styles.profileContent}>
          {/* Identity Header */}
          <motion.section 
            className={styles.identityHeader}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.brandingRow}>
              <div className={styles.logoWrapper}>
                <div className={styles.logo}>
                  {profileImage ? (
                    <img src={profileImage} alt="Restaurant" className={styles.logoImage} />
                  ) : (
                    <UtensilsCrossed className={styles.logoIcon} />
                  )}
                </div>
                {isEditing && (
                  <button 
                    className={styles.editPfpBtn}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Edit profile picture"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setProfileImage(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              
              <div className={styles.brandInfo}>
                <div className={styles.nameRow}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={styles.editInput}
                      placeholder="Restaurant Name"
                    />
                  ) : (
                    <h1 className={styles.restaurantName}>{restaurantDataMerged.name}</h1>
                  )}

                </div>
              </div>

              <div className={styles.operationalToggle}>
                <span className={styles.toggleLabel}>{isOnline ? 'Open' : 'Closed'}</span>
                <button
                  className={`${styles.toggleSwitch} ${isOnline ? styles.toggleOn : styles.toggleOff}`}
                  onClick={() => setOnlineStatus(!isOnline)}
                  aria-label={`Toggle restaurant ${isOnline ? 'closed' : 'open'}`}
                >
                  <div className={styles.toggleKnob} />
                </button>
              </div>
            </div>
          </motion.section>

          {/* Business & Legal Credentials */}
          <motion.section 
            className={styles.section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className={styles.sectionTitle}>
              <ShieldCheck className={styles.sectionIcon} />
              Business & Legal
            </h2>
            
            <div className={styles.card}>
              <div className={styles.cardRow}>
                <div className={styles.cardRowIcon}>
                  <Building2 />
                </div>
                <div className={styles.cardRowContent}>
                  <span className={styles.cardLabel}>GSTIN</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      className={styles.editInputSmall}
                      placeholder="GSTIN Number"
                    />
                  ) : (
                    <span className={styles.cardValue}>{restaurantDataMerged.gstin}</span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className={styles.editInputSmall}
                      placeholder="Business Name"
                    />
                  ) : (
                    <span className={styles.cardMeta}>{restaurantDataMerged.businessName}</span>
                  )}
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.cardRow}>
                <div className={styles.cardRowIcon}>
                  <Store />
                </div>
                <div className={styles.cardRowContent}>
                  <span className={styles.cardLabel}>Restaurant Category</span>
                  <div className={styles.categoryTags}>
                    {restaurantDataMerged.categories.map((cat, idx) => (
                      <span key={idx} className={styles.categoryTag}>{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Financial & Payout Hub */}
          <motion.section 
            className={styles.section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className={styles.sectionTitle}>
              <Landmark className={styles.sectionIcon} />
              Financial & Payouts
            </h2>
            
            <div className={styles.card}>
              <div className={styles.cardRow}>
                <div className={styles.cardRowIcon}>
                  <CreditCard />
                </div>
                <div className={styles.cardRowContent}>
                  <span className={styles.cardLabel}>Bank Account</span>
                  <div className={styles.bankRow}>
                  <span className={styles.cardValue}>
                      {showBankDetails ? '1234567894521' : restaurantDataMerged.bankAccount}
                    </span>
                    <button 
                      className={styles.eyeBtn}
                      onClick={() => setShowBankDetails(!showBankDetails)}
                      aria-label={showBankDetails ? 'Hide details' : 'Show details'}
                    >
                      {showBankDetails ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  <span className={styles.cardMeta}>{restaurantDataMerged.bankName}</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.cardRow}>
                <div className={styles.cardRowIcon}>
                  <Calendar />
                </div>
                <div className={styles.cardRowContent}>
                  <span className={styles.cardLabel}>Payout Cycle</span>
                  <span className={styles.cardValueHighlight}>{restaurantDataMerged.payoutCycle}</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.earningsBox}>
                <span className={styles.earningsLabel}>Total Earnings This Week</span>
                <div className={styles.earningsValue}>
                  <IndianRupee className={styles.rupeeIcon} />
                  <span>{restaurantDataMerged.weeklyEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </motion.section>



          {/* Settings & System Controls */}
          <motion.section 
            className={styles.section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className={styles.sectionTitle}>
              <Bell className={styles.sectionIcon} />
              Notifications
            </h2>
            
            <div className={styles.card}>
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <Volume2 className={styles.settingIcon} />
                  <span>New Order Sound</span>
                </div>
                <button
                  className={`${styles.miniToggle} ${notifications.orderSound ? styles.miniToggleOn : ''}`}
                  onClick={() => toggleNotification('orderSound')}
                >
                  <div className={styles.miniToggleKnob} />
                </button>
              </div>

              <div className={styles.divider} />

              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <Bike className={styles.settingIcon} />
                  <span>Rider Arrival Alerts</span>
                </div>
                <button
                  className={`${styles.miniToggle} ${notifications.riderAlerts ? styles.miniToggleOn : ''}`}
                  onClick={() => toggleNotification('riderAlerts')}
                >
                  <div className={styles.miniToggleKnob} />
                </button>
              </div>

            </div>
          </motion.section>

          {/* Contact Support */}
          <motion.section 
            className={styles.section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className={styles.sectionTitle}>
              <Phone className={styles.sectionIcon} />
              Support
            </h2>
            
            <button className={styles.whatsappBtn} onClick={handleContactSupport}>
              <svg viewBox="0 0 24 24" className={styles.whatsappIcon}>
                <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp Support</span>
            </button>
          </motion.section>

          {/* Security */}
          <motion.section 
            className={styles.section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className={styles.sectionTitle}>
              <Lock className={styles.sectionIcon} />
              Security
            </h2>
            
            <div className={styles.card}>
              <button className={styles.menuRow}>
                <div className={styles.menuRowLeft}>
                  <Lock className={styles.menuIcon} />
                  <span>Change Password</span>
                </div>
                <ChevronRight className={styles.menuArrow} />
              </button>
            </div>
          </motion.section>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </button>
          </motion.div>

          <p className={styles.version}>MyEzz Partner v1.0.0</p>
        </div>
      </motion.div>
    </motion.div>

      {/* Toast Save - Only shows when there are unsaved changes */}
      <AnimatePresence>
        {toastState && (
          <ToastSave
            state={toastState}
            onSave={handleSave}
            onReset={handleReset}
            initialText="Unsaved changes"
            loadingText="Saving..."
            successText="Your changes have been saved"
          />
        )}
      </AnimatePresence>

      {/* Success Toast - Shows after successful save */}
      {showSuccessToast && (
        <SuccessToast 
          message="Your settings have been saved"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  );
};

export default Profile;
