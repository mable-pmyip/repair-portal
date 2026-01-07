import { CheckCircle } from 'lucide-react';

interface SubmissionSuccessProps {
  orderNumber: string;
  onSubmitAnother: () => void;
}

export default function SubmissionSuccess({ orderNumber, onSubmitAnother }: SubmissionSuccessProps) {
  return (
    <div className="submission-success-container">
      <div className="submission-success-card">
        <div className="success-icon">
          <CheckCircle size={64} />
        </div>
        <h2>Request Submitted Successfully!</h2>
        <p className="success-message">
          Your repair request has been received and is being processed.
        </p>
        
        <div className="order-number-section">
          <label>Your Request Number:</label>
          <div className="order-number">
            {orderNumber}
          </div>
          <p className="order-info">
            Please save this number for your records. You can use it to track your request status.
          </p>
        </div>

        <div className="success-actions">
          <button onClick={onSubmitAnother} className="btn-primary">
            Submit Another Request
          </button>
        </div>
      </div>
    </div>
  );
}
