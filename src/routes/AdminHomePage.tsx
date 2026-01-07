import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminHomePage() {
  const { t } = useLanguage();

  return (
    <div className="admin-home-page">
      <div className="admin-home-content">
        <div className="welcome-card">
          <div className="welcome-icon">🛡️</div>
          <h1>Admin Portal</h1>
          <p className="welcome-subtitle">Welcome back! What would you like to do today?</p>
        </div>

        <div className="admin-quick-actions">
          <Link to="/admin/dashboard" className="admin-action-card">
            <div className="action-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h2>{t('app.adminPanel')}</h2>
            <p>View and manage repair requests</p>
          </Link>

          <Link to="/admin/users" className="admin-action-card">
            <div className="action-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h2>{t('app.userManagement')}</h2>
            <p>Add, edit, or manage user accounts</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
