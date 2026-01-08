import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
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

  // Sanitize username to ensure it can be used in email
  const sanitizeUsername = (username: string): string => {
    return username
      .trim()
      .toLowerCase()
      .normalize('NFD') // Decompose unicode characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9.-]/g, '') // Keep only valid email characters
      .replace(/^[.-]+|[.-]+$/g, '') // Remove leading/trailing dots and hyphens
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .slice(0, 64);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Sanitize inputs before sending
    const sanitizedUsername = sanitizeUsername(formData.username);
    const sanitizedDepartment = formData.department.trim();

    // Validate sanitized username
    if (!sanitizedUsername || sanitizedUsername.length === 0) {
      setError('Username contains invalid characters. Please use only letters, numbers, dots, and hyphens.');
      setLoading(false);
      return;
    }

    // Additional validation for email format
    if (sanitizedUsername.length < 1) {
      setError('Username is too short.');
      setLoading(false);
      return;
    }

    // Use environment variable for API URL (Worker will be deployed separately)
    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    try {
      // Call backend API to create user (Cloudflare Worker)
      const response = await fetch(`${apiUrl}/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: sanitizedUsername,
          department: sanitizedDepartment,
          password: DEFAULT_PASSWORD,
          createdBy: auth.currentUser?.email || 'admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Add user to Firestore from frontend (has proper auth)
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
      setError(err.message || t('userManagement.errorAddingUser'));
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
      title: 'Reset Password',
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
      title: 'Delete User',
      message: t('userManagement.confirmDeleteUser'),
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
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
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
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
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label htmlFor="username">{t('userManagement.username')}</label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    const cleaned = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9.-]/g, '')
                      .replace(/\.{2,}/g, '.')
                      .replace(/^[.-]+/, '');
                    setFormData({ ...formData, username: cleaned });
                  }}
                  required
                  placeholder={t('userManagement.usernamePlaceholder')}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="email"
                />
                {formData.username && (
                  <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Email will be: {formData.username}@repairportal.com
                  </small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="department">{t('userManagement.department')}</label>
                <input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value.trim() })}
                  required
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>
              ×
            </button>
            <h2>{t('userManagement.editUser')}</h2>
            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label htmlFor="edit-username">{t('userManagement.username')}</label>
                <input
                  id="edit-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.trim() })}
                  required
                  placeholder={t('userManagement.usernamePlaceholder')}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
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
              <div className="modal-actions">
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
