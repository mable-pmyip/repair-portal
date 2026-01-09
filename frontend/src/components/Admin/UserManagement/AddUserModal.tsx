import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '../../../firebase';
import { DEFAULT_PASSWORD } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { validateUsername, sanitizeUsername } from '../../../utils/userValidation';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AddUserModal({ isOpen, onClose, onSuccess, onError }: AddUserModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setLoading(true);

    // Validate username
    const validation = validateUsername(formData.username, t);
    if (!validation.isValid) {
      setModalError(validation.error);
      setLoading(false);
      return;
    }

    // Sanitize inputs before sending
    const sanitizedUsername = sanitizeUsername(formData.username);
    const sanitizedDepartment = formData.department.trim();

    try {
      // Call Firebase Cloud Function to create user
      const functions = getFunctions();
      const createUser = httpsCallable(functions, 'createUser');
      
      const result = await createUser({
        username: sanitizedUsername,
        department: sanitizedDepartment,
        password: DEFAULT_PASSWORD,
      });

      const data = result.data as { uid: string; email: string };

      // Add user to Firestore
      await addDoc(collection(db, 'users'), {
        uid: data.uid,
        email: data.email,
        username: sanitizedUsername,
        department: sanitizedDepartment,
        status: 'active',
        isFirstLogin: true,
        createdAt: new Date(),
        createdBy: auth.currentUser?.email || 'admin',
      });

      onSuccess(t('userManagement.userAddedSuccess'));
      setFormData({ username: '', department: '' });
      setModalError('');
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || t('userManagement.errorAddingUser');
      if (errorMessage.includes('already-exists')) {
        onError(`User "${sanitizedUsername}" already exists in Firebase Authentication.`);
      } else {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ username: '', department: '' });
    setModalError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          ×
        </button>
        <h2>{t('userManagement.addNewUser')}</h2>
        {modalError && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {modalError}
            <button onClick={() => setModalError('')} className="alert-close">×</button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('userManagement.username')}</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => {
                // Only allow alphanumeric characters during input
                const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                setFormData({ ...formData, username: cleaned });
                setModalError(''); // Clear error on input change
              }}
              placeholder="e.g. john123"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              {t('userManagement.usernameValidationHint')}
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="department">{t('userManagement.department')}</label>
            <input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value.trim() })}
              placeholder={t('userManagement.departmentPlaceholder')}
              autoComplete="off"
            />
          </div>
          <div className="info-box">
            <p>
              {t('userManagement.defaultPasswordInfo')}: <strong>{DEFAULT_PASSWORD}</strong>
            </p>
            <p>{t('userManagement.firstLoginInfo')}</p>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn-secondary">
              {t('userManagement.cancel')}
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t('userManagement.adding') : t('userManagement.addUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
