import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { Lock } from 'lucide-react';

interface PasswordResetProps {
  userId: string;
  onSuccess: () => void;
}

export default function PasswordReset({ userId, onSuccess }: PasswordResetProps) {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setError(t('passwordReset.passwordTooShort'));
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError(t('passwordReset.passwordNeedsUppercase'));
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setError(t('passwordReset.passwordNeedsLowercase'));
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError(t('passwordReset.passwordNeedsNumber'));
      return false;
    }
    if (!/[!@#$%^&*]/.test(password)) {
      setError(t('passwordReset.passwordNeedsSpecial'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('passwordReset.passwordsDoNotMatch'));
      return;
    }

    if (!validatePassword(newPassword)) {
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError(t('passwordReset.notAuthenticated'));
        return;
      }

      // Update password in Firebase Auth
      await updatePassword(currentUser, newPassword);

      // Update user record to indicate password has been changed
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isFirstLogin: false,
      });

      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError(t('passwordReset.requiresRecentLogin'));
      } else {
        setError(err.message || t('passwordReset.errorResetting'));
      }
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content password-reset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <Lock size={32} />
          <h2>{t('passwordReset.title')}</h2>
        </div>
        <p className="modal-description">{t('passwordReset.description')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">{t('passwordReset.newPassword')}</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder={t('passwordReset.newPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('passwordReset.confirmPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('passwordReset.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </div>

          <div className="password-requirements">
            <p className="requirements-title">{t('passwordReset.requirements')}</p>
            <ul>
              <li className={newPassword.length >= 8 ? 'met' : ''}>
                {t('passwordReset.requirementLength')}
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>
                {t('passwordReset.requirementUppercase')}
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'met' : ''}>
                {t('passwordReset.requirementLowercase')}
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>
                {t('passwordReset.requirementNumber')}
              </li>
              <li className={/[!@#$%^&*]/.test(newPassword) ? 'met' : ''}>
                {t('passwordReset.requirementSpecial')}
              </li>
            </ul>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary btn-block">
            {loading ? t('passwordReset.resetting') : t('passwordReset.resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
