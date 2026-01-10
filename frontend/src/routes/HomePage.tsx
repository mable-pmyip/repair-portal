import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-language-selector-mobile">
          <LanguageSelector />
        </div>
        <h1 className="home-main-title">Welcome to the Repair Portal</h1>
        <p className="home-description">Submit and track facility repair requests efficiently</p>
        <div className="home-actions">
          <button 
            className="btn-primary btn-large"
            onClick={() => navigate('/user-login')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/>
              <path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
            {t('app.userLoginButton')}
          </button>
          <button 
            className="btn-secondary btn-large"
            onClick={() => navigate('/admin-login')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            {t('app.adminLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
