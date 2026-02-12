import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import useKeyboard from '../../hooks/useKeyboard';
import styles from './RejectionModal.module.css';

const RejectionModal = ({ isOpen, onClose, onConfirm, orderDetails }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [otherReason, setOtherReason] = useState('');

    const rejectionReasons = [
        'Out of Stock',
        'Kitchen Too Busy',
        'Closing Soon',
        'Cannot Fulfill Special Request'
    ];

    const handleConfirm = () => {
        const finalReason = selectedReason === 'Other' ? otherReason : selectedReason;
        if (finalReason) {
            onConfirm(finalReason);
            onClose();
            // Reset state
            setSelectedReason('');
            setOtherReason('');
        }
    };

    const isConfirmDisabled = !selectedReason || (selectedReason === 'Other' && !otherReason.trim());

    useKeyboard({
        onEscape: onClose,
        onEnter: () => {
            if (!isConfirmDisabled) {
                handleConfirm();
            }
        }
    }, [isConfirmDisabled, selectedReason, otherReason], isOpen);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        <AlertTriangle size={20} className={styles.warningIcon} />
                        Reject Order
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {orderDetails && (
                    <div className={styles.orderSummary}>
                        <h3>Rejecting Order #{orderDetails.id}</h3>
                        <p>Please select a reason for rejection:</p>
                    </div>
                )}

                <div className={styles.reasonsList}>
                    {rejectionReasons.map((reason) => (
                        <label key={reason} className={styles.reasonOption}>
                            <input
                                type="radio"
                                name="rejectionReason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className={styles.radioInput}
                            />
                            <span className={styles.reasonText}>{reason}</span>
                        </label>
                    ))}
                    <label className={styles.reasonOption}>
                        <input
                            type="radio"
                            name="rejectionReason"
                            value="Other"
                            checked={selectedReason === 'Other'}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className={styles.radioInput}
                        />
                        <span className={styles.reasonText}>Other</span>
                    </label>
                </div>

                {selectedReason === 'Other' && (
                    <div className={styles.otherReasonInput}>
                        <textarea
                            placeholder="Please specify the reason..."
                            value={otherReason}
                            onChange={(e) => setOtherReason(e.target.value)}
                            className={styles.textarea}
                            rows={3}
                        />
                    </div>
                )}

                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.rejectBtn}
                        onClick={handleConfirm}
                        disabled={!selectedReason || (selectedReason === 'Other' && !otherReason.trim())}
                    >
                        Confirm Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectionModal;
