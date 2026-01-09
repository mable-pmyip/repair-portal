import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '../../firebase';
import { PortalUser, DEFAULT_PASSWORD } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns';
import { UserPlus, Edit2, Trash2, Lock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ConfirmModal from '../../components/Admin/ConfirmModal';

export default function UserManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData: PortalUser[] = [];
      snapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() } as PortalUser);
      });
      setUsers(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Validate username format
  const validateUsername = (username: string): { isValid: boolean; error: string } => {
    const trimmedUsername = username.trim();
    
    // Check if empty
    if (!trimmedUsername) {
      return { isValid: false, error: t('userManagement.errors.usernameEmpty') };
    }
    
    // Check minimum length (more than 6 characters means at least 7)
    if (trimmedUsername.length <= 6) {
      return { isValid: false, error: t('userManagement.errors.usernameTooShort') };
    }
    
    // Check if starts with alphabet
    if (!/^[a-zA-Z]/.test(trimmedUsername)) {
      return { isValid: false, error: t('userManagement.errors.usernameMustStartWithLetter') };
    }
    
    // Check if contains only alphanumeric characters (no spaces or special characters)
    if (!/^[a-zA-Z0-9]+$/.test(trimmedUsername)) {
      return { isValid: false, error: t('userManagement.errors.usernameInvalidCharacters') };
    }
    
    return { isValid: true, error: '' };
  };

  // Sanitize username to ensure it can be used in email
  const sanitizeUsername = (username: string): string => {
    return username
      .trim()
      .toLowerCase();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setModalError('');
    setLoading(true);

    // Validate username
    const validation = validateUsername(formData.username);
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

      setSuccess(t('userManagement.userAddedSuccess'));
      setShowAddModal(false);
      setFormData({ username: '', department: '' });
    } catch (err: any) {
      const errorMessage = err.message || t('userManagement.errorAddingUser');
      if (errorMessage.includes('already-exists')) {
        setError(`User "${sanitizedUsername}" already exists in Firebase Authentication.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.id) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        username: formData.username,
        department: formData.department,
      });

      setSuccess(t('userManagement.userUpdatedSuccess'));
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ username: '', department: '' });
    } catch (err: any) {
      setError(err.message || t('userManagement.errorUpdatingUser'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('userManagement.resetPasswordTitle'),
      message: t('userManagement.confirmResetPassword'),
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            isFirstLogin: true,
          });
          setSuccess(t('userManagement.passwordResetSuccess'));
        } catch (err: any) {
          setError(err.message || t('userManagement.errorResettingPassword'));
        }
      }
    });
  };

  const handleDeleteUser = async (user: PortalUser) => {
    setConfirmModal({
      isOpen: true,
      title: t('userManagement.deleteUserTitle'),
      message: t('userManagement.confirmDeleteUser'),
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          // Delete from Firebase Auth using Cloud Function
          const functions = getFunctions();
          const deleteUser = httpsCallable(functions, 'deleteUser');
          await deleteUser({ uid: user.uid });

          // Delete from Firestore
          if (user.id) {
            await deleteDoc(doc(db, 'users', user.id));
          }
          setSuccess(t('userManagement.userDeletedSuccess'));
        } catch (err: any) {
          setError(err.message || t('userManagement.errorDeletingUser'));
        }
      }
    });
  };

  const openEditModal = (user: PortalUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      department: user.department,
    });
    setShowEditModal(true);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any = a[sortColumn as keyof PortalUser];
    let bValue: any = b[sortColumn as keyof PortalUser];

    // Handle null/undefined
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;

    // Handle Timestamp objects
    if (aValue?.toDate) aValue = aValue.toDate().getTime();
    if (bValue?.toDate) bValue = bValue.toDate().getTime();

    // String comparison (case-insensitive)
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} />;
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="user-management">
      <div className="dashboard-header">
        <h1>{t('userManagement.title')}</h1>
        <button onClick={() => { setShowAddModal(true); setModalError(''); }} className="btn-primary">
          <UserPlus size={18} />
          {t('userManagement.addUser')}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('username')} className="sortable-header">
                <span>
                  {t('userManagement.username')}
                  <SortIcon column="username" />
                </span>
              </th>
              <th onClick={() => handleSort('department')} className="sortable-header">
                <span>
                  {t('userManagement.department')}
                  <SortIcon column="department" />
                </span>
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable-header">
                <span>
                  {t('userManagement.createdAt')}
                  <SortIcon column="createdAt" />
                </span>
              </th>
              <th onClick={() => handleSort('lastLogin')} className="sortable-header">
                <span>
                  {t('userManagement.lastLogin')}
                  <SortIcon column="lastLogin" />
                </span>
              </th>
              <th>{t('userManagement.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-data">
                  {t('userManagement.noUsers')}
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.department}</td>
                  <td>{format(user.createdAt.toDate(), 'MMM dd, yyyy')}</td>
                  <td>{user.lastLogin ? format(user.lastLogin.toDate(), 'MMM dd, yyyy HH:mm') : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openEditModal(user)}
                        className="btn-icon"
                        title={t('userManagement.edit')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id!)}
                        className="btn-icon"
                        title={t('userManagement.resetPassword')}
                      >
                        <Lock size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="btn-icon btn-danger"
                        title={t('userManagement.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>
              ×
            </button>
            <h2>{t('userManagement.addNewUser')}</h2>
            {modalError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {modalError}
                <button onClick={() => setModalError('')} className="alert-close">×</button>
              </div>
            )}
            <form onSubmit={handleAddUser}>
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
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  {t('userManagement.cancel')}
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? t('userManagement.adding') : t('userManagement.addUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon info">
              <Edit2 size={48} />
            </div>
            <h2 className="confirm-title">{t('userManagement.editUser')}</h2>
            <form onSubmit={handleEditUser} style={{ textAlign: 'left' }}>
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
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  {t('userManagement.cancel')}
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? t('userManagement.updating') : t('userManagement.update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        variant="danger"
      />
    </div>
  );
}
