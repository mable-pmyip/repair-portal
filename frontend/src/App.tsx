import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import UserManagement from './routes/Admin/UserManagement';
import AdminDashboard from './routes/Admin/AdminDashboard';
import PasswordReset from './components/PasswordReset';
import LanguageSelector from './components/LanguageSelector';
import HomePage from './routes/HomePage';
import AdminHomePage from './routes/Admin/AdminHomePage';
import AdminLoginPage from './routes/Admin/AdminLoginPage';
import UserLoginPage from './routes/User/UserLoginPage';
import MyRequestsPage from './routes/User/MyRequestsPage';
import ProtectedRoute from './routes/ProtectedRoute';
import { useLanguage } from './contexts/LanguageContext';
import { PortalUser } from './types';
import './App.css';

function AppContent() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserDropdown]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticating(true);
        // Check if user exists in users collection
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // User exists in users collection - regular user
          const userData = querySnapshot.docs[0].data() as PortalUser;
          userData.id = querySnapshot.docs[0].id;
          setCurrentUser(userData);
          setIsAdmin(false);

          // Check if first login - only show password reset if we're on a user-facing route
          if (userData.isFirstLogin && !location.pathname.startsWith('/admin')) {
            setShowPasswordReset(true);
          } else if (location.pathname === '/user-login') {
            navigate('/user/my-requests');
          }
        } else {
          // User NOT in users collection - treat as admin
          setIsAdmin(true);
          setCurrentUser(null);
          if (location.pathname === '/admin-login') {
            navigate('/admin');
          }
        }
        setIsAuthenticating(false);
      } else {
        setIsAdmin(false);
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUserLogin = (user: PortalUser) => {
    setCurrentUser(user);
    if (user.isFirstLogin) {
      setShowPasswordReset(true);
    }
  };

  const handlePasswordResetSuccess = () => {
    setShowPasswordReset(false);
    setCurrentUser(prev => prev ? { ...prev, isFirstLogin: false } : null);
  };

  if (isLoading) {
    return <div className="loading">{t('app.loading')}</div>;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-left">
          <a 
            href="https://github.com/mable-pmyip/repair-portal" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link"
            title="View on GitHub"
          >
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
        </div>
        {isAdmin ? (
          <Link to="/admin" className="nav-brand nav-brand-link">
            <h1>{t('app.title')}</h1>
          </Link>
        ) : (
          <div className="nav-brand">
            <h1>{t('app.title')}</h1>
          </div>
        )}
        <div className="nav-links">
          {!isAdmin && !currentUser ? (
            <>
              <Link 
                to="/user-login"
                className={location.pathname === '/user-login' ? 'nav-link active' : 'nav-link'}
                title={t('app.userLoginButton')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
                <span className="nav-link-text">{t('app.userLoginButton')}</span>
              </Link>
              <Link 
                to="/admin-login"
                className={location.pathname === '/admin-login' ? 'nav-link active' : 'nav-link'}
                title={t('app.adminLogin')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span className="nav-link-text">{t('app.adminLogin')}</span>
              </Link>
            </>
          ) : null}
          {currentUser && !isAdmin && (
            <div className="user-menu">
              <button 
                  className="user-menu-trigger"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  title={currentUser.username}
              >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="user-name">{currentUser.username}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                  </svg>
              </button>
              {showUserDropdown && (
                  <div className="user-dropdown">
                  <button onClick={handleLogout} className="user-dropdown-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                      </svg>
                      {t('app.logout')}
                  </button>
                  </div>
              )}
            </div>
          )}
          {isAdmin && (
            <>
              <Link
                to="/admin/dashboard"
                className={location.pathname.startsWith('/admin/dashboard') ? 'nav-link active' : 'nav-link'}
                title={t('app.adminPanel')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span className="nav-link-text">{t('app.adminPanel')}</span>
              </Link>
              <Link
                to="/admin/users"
                className={location.pathname.startsWith('/admin/users') ? 'nav-link active' : 'nav-link'}
                title={t('app.userManagement')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="nav-link-text">{t('app.userManagement')}</span>
              </Link>
              <button onClick={handleLogout} className="btn-secondary" title={t('app.logout')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                <span className="btn-text">{t('app.logout')}</span>
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="main-content">
        {isAuthenticating && (
          <div className="auth-loading-overlay">
            <div className="auth-loading-spinner">
              <div className="spinner-circle"></div>
              <p>Loading...</p>
            </div>
          </div>
        )}

        {showPasswordReset && currentUser?.id && (
          <PasswordReset userId={currentUser.id} onSuccess={handlePasswordResetSuccess} />
        )}

        <Routes>
          <Route 
            path="/" 
            element={
              isAdmin ? (
                <Navigate to="/admin/dashboard" replace />
              ) : currentUser ? (
                <Navigate to="/user/my-requests" replace />
              ) : (
                <HomePage />
              )
            } 
          />
          <Route path="/user-login" element={<UserLoginPage onLoginSuccess={handleUserLogin} />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route 
            path="/user/my-requests" 
            element={
              <ProtectedRoute isAllowed={!!currentUser} redirectTo="/user-login">
                <MyRequestsPage user={currentUser!} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute isAllowed={isAdmin} redirectTo="/admin-login">
                <AdminHomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute isAllowed={isAdmin} redirectTo="/admin-login">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute isAllowed={isAdmin} redirectTo="/admin-login">
                <UserManagement />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      <footer className="footer">
        <p>{t('app.footer')}</p>
        <LanguageSelector />
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
