import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { FileText, History } from 'lucide-react';

export default function UserHomePage() {
  const { t } = useLanguage();

  return (
    <div className="user-home-page">
      <div className="welcome-section">
        <h1>{t('userHome.title')}</h1>
        <p>{t('userHome.subtitle')}</p>
      </div>

      <div className="home-cards">
        <Link to="/user/submit" className="home-card">
          <div className="card-icon submit">
            <FileText size={48} />
          </div>
          <h2>{t('userHome.submitRequest')}</h2>
          <p>{t('userHome.submitDescription')}</p>
          <span className="card-arrow">→</span>
        </Link>

        <Link to="/user/my-requests" className="home-card">
          <div className="card-icon history">
            <History size={48} />
          </div>
          <h2>{t('userHome.myRequests')}</h2>
          <p>{t('userHome.myRequestsDescription')}</p>
          <span className="card-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}
