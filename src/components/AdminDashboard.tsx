import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { RepairRequest } from '../types';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, List, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [followUpAction, setFollowUpAction] = useState<{ [key: string]: string }>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportDateType, setExportDateType] = useState<'all' | 'created' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const q = query(collection(db, 'repairs'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repairData: RepairRequest[] = [];
      snapshot.forEach((doc) => {
        repairData.push({ id: doc.id, ...doc.data() } as RepairRequest);
      });
      setRepairs(repairData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsCompleted = async (repairId: string) => {
    try {
      const repairRef = doc(db, 'repairs', repairId);
      await updateDoc(repairRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating repair:', error);
    }
  };

  const handleAddFollowUpAction = async (repairId: string) => {
    const action = followUpAction[repairId]?.trim();
    if (!action) return;

    try {
      const repair = repairs.find(r => r.id === repairId);
      const currentActions = repair?.followUpActions || [];
      const repairRef = doc(db, 'repairs', repairId);
      await updateDoc(repairRef, {
        followUpActions: [...currentActions, action],
      });
      setFollowUpAction({ ...followUpAction, [repairId]: '' });
    } catch (error) {
      console.error('Error adding follow-up action:', error);
    }
  };

  const handleMarkAsPending = async (repairId: string) => {
    try {
      const repairRef = doc(db, 'repairs', repairId);
      await updateDoc(repairRef, {
        status: 'pending',
        completedAt: null,
      });
    } catch (error) {
      console.error('Error updating repair:', error);
    }
  };

  const handleCancelRepair = async (repairId: string) => {
    try {
      const repairRef = doc(db, 'repairs', repairId);
      await updateDoc(repairRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error cancelling repair:', error);
    }
  };

  const toggleDescription = (repairId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [repairId]: !prev[repairId]
    }));
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const exportToCSV = () => {
    if (!exportStartDate || !exportEndDate) {
      alert(t('adminDashboard.exportModal.selectDatesError'));
      return;
    }

    const startDate = new Date(exportStartDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(exportEndDate);
    endDate.setHours(23, 59, 59, 999);

    // Filter repairs based on selected date range and type
    const filteredData = repairs.filter(repair => {
      if (exportDateType === 'all') {
        // Check if any date falls within range
        const createdDate = repair.createdAt.toDate();
        const completedDate = repair.completedAt?.toDate();
        const cancelledDate = repair.cancelledAt?.toDate();

        const createdInRange = createdDate >= startDate && createdDate <= endDate;
        const completedInRange = completedDate && completedDate >= startDate && completedDate <= endDate;
        const cancelledInRange = cancelledDate && cancelledDate >= startDate && cancelledDate <= endDate;

        return createdInRange || completedInRange || cancelledInRange;
      }

      let dateToCheck: Date | null = null;

      if (exportDateType === 'created') {
        dateToCheck = repair.createdAt.toDate();
      } else if (exportDateType === 'completed' && repair.completedAt) {
        dateToCheck = repair.completedAt.toDate();
      } else if (exportDateType === 'cancelled' && repair.cancelledAt) {
        dateToCheck = repair.cancelledAt.toDate();
      }

      if (!dateToCheck) return false;
      return dateToCheck >= startDate && dateToCheck <= endDate;
    });

    if (filteredData.length === 0) {
      alert(t('adminDashboard.exportModal.noRecordsError'));
      return;
    }

    // Create CSV content
    const headers = [
      'Order Number',
      'Status',
      'Submitter Name',
      'Location',
      'Description',
      'Created Date',
      'Completed Date',
      'Cancelled Date',
      'Follow-up Actions'
    ];

    const csvRows = [headers.join(',')];

    filteredData.forEach(repair => {
      const row = [
        `"${repair.orderNumber}"`,
        `"${repair.status}"`,
        `"${repair.submitterName || ''}"`,
        `"${repair.location || ''}"`,
        `"${(repair.description || '').replace(/"/g, '""')}"`,
        `"${format(repair.createdAt.toDate(), 'yyyy-MM-dd HH:mm')}"`,
        repair.completedAt ? `"${format(repair.completedAt.toDate(), 'yyyy-MM-dd HH:mm')}"` : '""',
        repair.cancelledAt ? `"${format(repair.cancelledAt.toDate(), 'yyyy-MM-dd HH:mm')}"` : '""',
        `"${(repair.followUpActions || []).join('; ').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    // Download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `repair-requests-${exportDateType}-${exportStartDate}-to-${exportEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Close modal
    setShowExportModal(false);
    setExportStartDate('');
    setExportEndDate('');
  };

  const filteredRepairs = repairs.filter(repair => {
    if (filter === 'all') return true;
    return repair.status === filter;
  });

  if (loading) {
    return <div className="loading">{t('adminDashboard.loadingRepairs')}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>{t('adminDashboard.title')}</h1>
        <button onClick={() => setShowExportModal(true)} className="btn-secondary">
          <Download size={18} />
          {t('adminDashboard.exportCSV')}
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'tab active' : 'tab'}
          onClick={() => setFilter('all')}
        >
          <List size={18} />
          {t('adminDashboard.all')} ({repairs.length})
        </button>
        <button
          className={filter === 'pending' ? 'tab active' : 'tab'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={18} />
          {t('adminDashboard.pending')} ({repairs.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={filter === 'completed' ? 'tab active' : 'tab'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={18} />
          {t('adminDashboard.completed')} ({repairs.filter(r => r.status === 'completed').length})
        </button>
        <button
          className={filter === 'cancelled' ? 'tab active' : 'tab'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={18} />
          {t('adminDashboard.cancelled')} ({repairs.filter(r => r.status === 'cancelled').length})
        </button>
      </div>

      <div className="repairs-grid">
        {filteredRepairs.length === 0 ? (
          <p className="no-repairs">{t('adminDashboard.noRepairs')}</p>
        ) : (
          filteredRepairs.map((repair) => (
            <div key={repair.id} className="repair-card">
              <div className="repair-header">
                <h3>{repair.orderNumber}</h3>
                <span className={`status-badge ${repair.status}`}>
                  {repair.status}
                </span>
              </div>
              
              <div className="repair-details">
                <p><strong>{t('adminDashboard.submittedBy')}</strong> {repair.submitterName}</p>
                <p><strong>{t('adminDashboard.location')}</strong> {repair.location}</p>
                <p><strong>{t('adminDashboard.date')}</strong> {format(repair.createdAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                {repair.completedAt && (
                  <p><strong>{t('adminDashboard.completedDate')}</strong> {format(repair.completedAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                )}
                {repair.cancelledAt && (
                  <p><strong>{t('adminDashboard.cancelledDate')}</strong> {format(repair.cancelledAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                )}
              </div>

              <div className="repair-description">
                <strong>{t('adminDashboard.description')}</strong>
                <p>
                  {expandedDescriptions[repair.id!] || repair.description.length <= 200
                    ? repair.description
                    : truncateText(repair.description, 200)}
                </p>
                {repair.description.length > 200 && (
                  <button
                    className="btn-expand"
                    onClick={() => toggleDescription(repair.id!)}
                  >
                    {expandedDescriptions[repair.id!] ? t('adminDashboard.showLess') : t('adminDashboard.readMore')}
                  </button>
                )}
              </div>

              {repair.followUpActions && repair.followUpActions.length > 0 && (
                <div className="follow-up-actions">
                  <strong>{t('adminDashboard.followUpActions')}</strong>
                  <ul>
                    {repair.followUpActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {repair.imageUrls.length > 0 && (
                <div className="repair-images">
                  <strong>{t('adminDashboard.images')}</strong>
                  <div className="image-grid">
                    {repair.imageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Repair ${index + 1}`}
                        onClick={() => setSelectedRepair(repair)}
                        className="thumbnail"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="repair-actions">
                {repair.status === 'pending' ? (
                  <>
                    <div className="follow-up-input">
                      <input
                        type="text"
                        placeholder={t('adminDashboard.addFollowUpPlaceholder')}
                        value={followUpAction[repair.id!] || ''}
                        onChange={(e) => setFollowUpAction({ ...followUpAction, [repair.id!]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFollowUpAction(repair.id!);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddFollowUpAction(repair.id!)}
                        className="btn-secondary"
                        disabled={!followUpAction[repair.id!]?.trim()}
                      >
                        {t('adminDashboard.addAction')}
                      </button>
                    </div>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleMarkAsCompleted(repair.id!)}
                        className="btn-success"
                      >
                        {t('adminDashboard.markAsCompleted')}
                      </button>
                      <button
                        onClick={() => handleCancelRepair(repair.id!)}
                        className="btn-danger"
                      >
                        {t('adminDashboard.cancelRequest')}
                      </button>
                    </div>
                  </>
                ) : repair.status === 'completed' ? (
                  <button
                    onClick={() => handleMarkAsPending(repair.id!)}
                    className="btn-warning"
                  >
                    {t('adminDashboard.reopen')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsPending(repair.id!)}
                    className="btn-warning"
                  >
                    {t('adminDashboard.restoreToPending')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRepair && (
        <div className="modal-overlay" onClick={() => setSelectedRepair(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedRepair(null)}
            >
              ×
            </button>
            <h2>{selectedRepair.orderNumber}</h2>
            <div className="modal-images">
              {selectedRepair.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Repair ${index + 1}`}
                  className="full-image"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowExportModal(false)}
            >
              ×
            </button>
            <h2>{t('adminDashboard.exportModal.title')}</h2>
            <p className="modal-description">{t('adminDashboard.exportModal.description')}</p>
            
            <div className="export-form">
              <div className="form-group">
                <label htmlFor="dateType">{t('adminDashboard.exportModal.filterBy')}</label>
                <select
                  id="dateType"
                  value={exportDateType}
                  onChange={(e) => setExportDateType(e.target.value as 'all' | 'created' | 'completed' | 'cancelled')}
                  className="export-select"
                >
                  <option value="all">{t('adminDashboard.exportModal.filterAll')}</option>
                  <option value="created">{t('adminDashboard.exportModal.filterCreated')}</option>
                  <option value="completed">{t('adminDashboard.exportModal.filterCompleted')}</option>
                  <option value="cancelled">{t('adminDashboard.exportModal.filterCancelled')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="startDate">{t('adminDashboard.exportModal.startDate')}</label>
                <input
                  id="startDate"
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="export-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">{t('adminDashboard.exportModal.endDate')}</label>
                <input
                  id="endDate"
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="export-input"
                />
              </div>

              <div className="export-actions">
                <button onClick={() => setShowExportModal(false)} className="btn-secondary">
                  {t('adminDashboard.exportModal.cancel')}
                </button>
                <button onClick={exportToCSV} className="btn-primary">
                  <Download size={18} />
                  {t('adminDashboard.exportModal.download')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
