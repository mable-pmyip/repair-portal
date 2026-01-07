import { CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SubmissionSuccessProps {
  orderNumber: string;
  onSubmitAnother: () => void;
}

export default function SubmissionSuccess({ orderNumber, onSubmitAnother }: SubmissionSuccessProps) {
  const { t } = useLanguage();

  return (
    <div className="submission-success-container">
      <div className="submission-success-card">
        <div className="success-icon">
          <CheckCircle size={64} />
        </div>
        <h2>{t('submissionSuccess.title')}</h2>
        <p className="success-message">
          {t('submissionSuccess.message')}
        </p>
        
        <div className="order-number-section">
          <label>{t('submissionSuccess.requestNumber')}</label>
          <div className="order-number">
            {orderNumber}
          </div>
          <p className="order-info">
            {t('submissionSuccess.saveInfo')}
          </p>
        </div>

        <div className="success-actions">
          <button onClick={onSubmitAnother} className="btn-primary">
            {t('submissionSuccess.submitAnother')}
          </button>
        </div>
      </div>
    </div>
  );
}
