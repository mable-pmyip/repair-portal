import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { PortalUser } from '../../types';

interface UserLoginProps {
  onLoginSuccess: (user: PortalUser) => void;
}

export default function UserLogin({ onLoginSuccess }: UserLoginProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert username to email format
      const emailToUse = email.includes('@') ? email : `${email.toLowerCase().replace(/\s+/g, '')}@repairportal.com`;
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      
      // Get user data from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', userCredential.user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(t('userLogin.userNotFound'));
        await auth.signOut();
        return;
      }

      const userData = querySnapshot.docs[0].data() as PortalUser;
      const userId = querySnapshot.docs[0].id;
      userData.id = userId;

      // Update last login
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastLogin: Timestamp.now(),
      });

      onLoginSuccess(userData);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError(t('userLogin.invalidCredentials'));
      } else if (err.code === 'auth/user-not-found') {
        setError(t('userLogin.userNotFound'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('userLogin.tooManyAttempts'));
      } else {
        setError(t('userLogin.errorLoggingIn'));
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-login-container">
      <div className="user-login-card">
        <div className="login-header">
          <h2>{t('userLogin.title')}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('userLogin.username')}</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('userLogin.usernamePlaceholder')}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('userLogin.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('userLogin.passwordPlaceholder')}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary btn-block">
            {loading ? t('userLogin.loggingIn') : t('userLogin.login')}
          </button>
        </form>
        <div className="login-footer">
          <p className="help-text">{t('userLogin.helpText')}</p>
        </div>
      </div>
    </div>
  );
}
