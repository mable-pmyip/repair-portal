import { CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SubmissionSuccessProps {
  orderNumber: string;
}

export default function SubmissionSuccess({ orderNumber }: SubmissionSuccessProps) {
  const { t } = useLanguage();

  return (
    <div className="submission-success-container">
      <div className="success-icon">
        <CheckCircle size={64} />
      </div>
      <h2>{t('submissionSuccess.title')}</h2>
      <div className="order-number-section">
        <label>{t('submissionSuccess.requestNumber')}</label>
        <div className="order-number">
          {orderNumber}
        </div>
        <p className="order-info">
          {t('submissionSuccess.message')}
        </p>
      </div>
    </div>
  );
}
