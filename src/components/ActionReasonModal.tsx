import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ActionReasonModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  variant: 'success' | 'danger';
}

export default function ActionReasonModal({
  isOpen,
  title,
  message,
  reasonLabel,
  reasonPlaceholder,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant
}: ActionReasonModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason(''); // Reset for next time
  };

  const handleCancel = () => {
    setReason(''); // Reset on cancel
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="confirm-modal action-reason-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon ${variant}`}>
          {variant === 'success' ? <CheckCircle size={48} /> : <XCircle size={48} />}
        </div>
        <h2 className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>
        
        <div className="form-group">
          <label htmlFor="actionReason">{reasonLabel}</label>
          <textarea
            id="actionReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            rows={4}
            className="action-reason-textarea"
          />
        </div>

        <div className="confirm-actions">
          <button onClick={handleCancel} className="btn-secondary">
            {cancelText}
          </button>
          <button onClick={handleConfirm} className={`btn-${variant}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
