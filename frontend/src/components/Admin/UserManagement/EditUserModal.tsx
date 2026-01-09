import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { PortalUser } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Edit2 } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  user: PortalUser | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function EditUserModal({ isOpen, user, onClose, onSuccess, onError }: EditUserModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    department: user?.department || '',
  });
  const [loading, setLoading] = useState(false);

  // Update form data when user changes
  if (isOpen && user && (formData.username !== user.username || formData.department !== user.department)) {
    setFormData({
      username: user.username,
      department: user.department,
    });
  }

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        username: formData.username,
        department: formData.department,
      });

      onSuccess(t('userManagement.userUpdatedSuccess'));
      onClose();
    } catch (err: any) {
      onError(err.message || t('userManagement.errorUpdatingUser'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon info">
          <Edit2 size={48} />
        </div>
        <h2 className="confirm-title">{t('userManagement.editUser')}</h2>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label htmlFor="edit-username">{t('userManagement.username')}</label>
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              {formData.username}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="edit-department">{t('userManagement.department')}</label>
            <input
              id="edit-department"
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value.trim() })}
              required
              placeholder={t('userManagement.departmentPlaceholder')}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <div className="confirm-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              {t('userManagement.cancel')}
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t('userManagement.updating') : t('userManagement.update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
