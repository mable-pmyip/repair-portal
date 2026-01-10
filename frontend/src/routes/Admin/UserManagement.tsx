import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebase';
import { PortalUser, DEFAULT_PASSWORD } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { format } from 'date-fns';
import { UserPlus, Edit2, Trash2, Lock } from 'lucide-react';
import ConfirmModal from '../../components/Admin/shared/ConfirmModal';
import AddUserModal from '../../components/Admin/UserManagement/AddUserModal';
import EditUserModal from '../../components/Admin/UserManagement/EditUserModal';
import SortIcon from '../../components/Admin/UserManagement/SortIcon';

export default function UserManagement() {
  const { t } = useLanguage();
  const { confirmModal, showConfirmation, closeConfirmation } = useConfirmModal();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData: PortalUser[] = [];
      snapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() } as PortalUser);
      });
      setUsers(userData);
    });

    return () => unsubscribe();
  }, []);

  const handleResetPassword = async (userId: string, userUid: string) => {
    showConfirmation(
      t('userManagement.resetPasswordTitle'),
      t('userManagement.confirmResetPassword'),
      async () => {
        closeConfirmation();
        try {
          // Reset password in Firebase Auth using Cloud Function
          const functions = getFunctions();
          const resetPassword = httpsCallable(functions, 'resetUserPassword');
          await resetPassword({ uid: userUid, password: DEFAULT_PASSWORD });

          // Update Firestore to mark as first login
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            isFirstLogin: true,
          });
          
          setSuccess(t('userManagement.passwordResetSuccess'));
        } catch (err: any) {
          setError(err.message || t('userManagement.errorResettingPassword'));
        }
      }
    );
  };

  const handleDeleteUser = async (user: PortalUser) => {
    showConfirmation(
      t('userManagement.deleteUserTitle'),
      t('userManagement.confirmDeleteUser'),
      async () => {
        closeConfirmation();
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
    );
  };

  const openEditModal = (user: PortalUser) => {
    setSelectedUser(user);
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

  return (
    <div className="user-management">
      {/* Mobile Header */}
      <div className="page-header-mobile">
        <h1>{t('userManagement.title')}</h1>
      </div>

      {/* Desktop Header */}
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

      {/* Mobile Cards View */}
      <div className="users-cards-mobile">
        {sortedUsers.length === 0 ? (
          <div className="empty-state">
            <UserPlus size={64} />
            <h3>{t('userManagement.noUsers')}</h3>
          </div>
        ) : (
          sortedUsers.map((user) => (
            <div key={user.id} className="user-card-mobile">
              <div className="user-card-header">
                <h3>{user.username}</h3>
                <span className="user-department">{user.department}</span>
              </div>
              <div className="user-card-details">
                <p><strong>{t('userManagement.createdAt')}:</strong> {format(user.createdAt.toDate(), 'MMM dd, yyyy')}</p>
                <p><strong>{t('userManagement.lastLogin')}:</strong> {user.lastLogin ? format(user.lastLogin.toDate(), 'MMM dd, yyyy HH:mm') : '-'}</p>
              </div>
              <div className="user-card-actions">
                <button
                  onClick={() => openEditModal(user)}
                  className="btn-secondary btn-small"
                >
                  <Edit2 size={16} />
                  {t('userManagement.edit')}
                </button>
                <button
                  onClick={() => handleResetPassword(user.id!, user.uid)}
                  className="btn-secondary btn-small"
                >
                  <Lock size={16} />
                  {t('userManagement.resetPassword')}
                </button>
                <button
                  onClick={() => handleDeleteUser(user)}
                  className="btn-danger btn-small"
                >
                  <Trash2 size={16} />
                  {t('userManagement.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('username')} className="sortable-header">
                <span>
                  {t('userManagement.username')}
                  <SortIcon column="username" sortColumn={sortColumn} sortDirection={sortDirection} />
                </span>
              </th>
              <th onClick={() => handleSort('department')} className="sortable-header">
                <span>
                  {t('userManagement.department')}
                  <SortIcon column="department" sortColumn={sortColumn} sortDirection={sortDirection} />
                </span>
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable-header">
                <span>
                  {t('userManagement.createdAt')}
                  <SortIcon column="createdAt" sortColumn={sortColumn} sortDirection={sortDirection} />
                </span>
              </th>
              <th onClick={() => handleSort('lastLogin')} className="sortable-header">
                <span>
                  {t('userManagement.lastLogin')}
                  <SortIcon column="lastLogin" sortColumn={sortColumn} sortDirection={sortDirection} />
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
                        onClick={() => handleResetPassword(user.id!, user.uid)}
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

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(message) => setSuccess(message)}
        onError={(message) => setError(message)}
      />

      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSuccess={(message) => setSuccess(message)}
        onError={(message) => setError(message)}
      />

      {/* Mobile Floating Add Button */}
      <button
        className="floating-add-button-mobile"
        onClick={() => setShowAddModal(true)}
        aria-label="Add new user"
      >
        <UserPlus size={24} />
      </button>

      {/* Handle password reset and user deletion */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmation}
        variant="danger"
      />
    </div>
  );
}
