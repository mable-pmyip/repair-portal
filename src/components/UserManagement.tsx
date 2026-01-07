import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { PortalUser, DEFAULT_PASSWORD } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';
import { UserPlus, Edit2, Trash2, Lock, UserX, UserCheck, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Call backend API to create user
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          department: formData.department,
          password: DEFAULT_PASSWORD,
          createdBy: auth.currentUser?.email || 'admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

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

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: currentStatus === 'active' ? 'suspended' : 'active',
      });
      setSuccess(
        currentStatus === 'active'
          ? t('userManagement.userSuspendedSuccess')
          : t('userManagement.userActivatedSuccess')
      );
    } catch (err: any) {
      setError(err.message || t('userManagement.errorUpdatingUser'));
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

  if (loading && users.length === 0) {
    return <div className="loading">{t('userManagement.loadingUsers')}</div>;
  }

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
                <span>{t('userManagement.username')}</span>
                <SortIcon column="username" />
              </th>
              <th onClick={() => handleSort('department')} className="sortable-header">
                <span>{t('userManagement.department')}</span>
                <SortIcon column="department" />
              </th>
              <th onClick={() => handleSort('status')} className="sortable-header">
                <span>{t('userManagement.status')}</span>
                <SortIcon column="status" />
              </th>
              <th onClick={() => handleSort('isFirstLogin')} className="sortable-header">
                <span>{t('userManagement.firstLogin')}</span>
                <SortIcon column="isFirstLogin" />
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable-header">
                <span>{t('userManagement.createdAt')}</span>
                <SortIcon column="createdAt" />
              </th>
              <th onClick={() => handleSort('lastLogin')} className="sortable-header">
                <span>{t('userManagement.lastLogin')}</span>
                <SortIcon column="lastLogin" />
              </th>
              <th>{t('userManagement.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  {t('userManagement.noUsers')}
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.department}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? t('userManagement.active') : t('userManagement.suspended')}
                    </span>
                  </td>
                  <td>
                    {user.isFirstLogin ? (
                      <span className="badge badge-warning">{t('userManagement.yes')}</span>
                    ) : (
                      <span className="badge badge-success">{t('userManagement.no')}</span>
                    )}
                  </td>
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
                        onClick={() => handleSuspendUser(user.id!, user.status)}
                        className="btn-icon"
                        title={
                          user.status === 'active'
                            ? t('userManagement.suspend')
                            : t('userManagement.activate')
                        }
                      >
                        {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
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
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder={t('userManagement.usernamePlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="department">{t('userManagement.department')}</label>
                <input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  placeholder={t('userManagement.departmentPlaceholder')}
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
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder={t('userManagement.usernamePlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-department">{t('userManagement.department')}</label>
                <input
                  id="edit-department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  placeholder={t('userManagement.departmentPlaceholder')}
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
