import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { RepairRequest } from '../../types';
import { Clock, CheckCircle, XCircle, List, Download, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import RepairRequestCard from '../RepairRequestCard';
import ActionReasonModal from '../ActionReasonModal';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [followUpAction, setFollowUpAction] = useState<{ [key: string]: string }>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportDateType, setExportDateType] = useState<'all' | 'created' | 'completed' | 'cancelled'>('all');
  const [actionModal, setActionModal] = useState<{ type: 'complete' | 'cancel' | null; repairId: string | null }>({ type: null, repairId: null });

  useEffect(() => {
    const q = query(collection(db, 'repairs'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repairData: RepairRequest[] = [];
      snapshot.forEach((doc) => {
        repairData.push({ id: doc.id, ...doc.data() } as RepairRequest);
      });
      setRepairs(repairData);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsCompleted = (repairId: string) => {
    setActionModal({ type: 'complete', repairId });
  };

  const confirmMarkAsCompleted = async (reason: string) => {
    if (!actionModal.repairId) return;
    
    try {
      const repairRef = doc(db, 'repairs', actionModal.repairId);
      await updateDoc(repairRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        completionReason: reason || null,
      });
      setActionModal({ type: null, repairId: null });
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

  const handleCancelRepair = (repairId: string) => {
    setActionModal({ type: 'cancel', repairId });
  };

  const confirmCancelRepair = async (reason: string) => {
    if (!actionModal.repairId) return;
    
    try {
      const repairRef = doc(db, 'repairs', actionModal.repairId);
      await updateDoc(repairRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancellationReason: reason || null,
      });
      setActionModal({ type: null, repairId: null });
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

  return (
    <div className="my-requests-page admin-dashboard">
      <div className="page-header">
        <div>
          <h1>{t('adminDashboard.title')}</h1>
          <p>{t('adminDashboard.subtitle')}</p>
        </div>
        <button onClick={() => setShowExportModal(true)} className="btn-secondary">
          <Download size={18} />
          {t('adminDashboard.exportCSV')}
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('all')}
        >
          <List size={18} />
          {t('adminDashboard.all')} ({repairs.length})
        </button>
        <button
          className={filter === 'pending' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={18} />
          {t('adminDashboard.pending')} ({repairs.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={18} />
          {t('adminDashboard.completed')} ({repairs.filter(r => r.status === 'completed').length})
        </button>
        <button
          className={filter === 'cancelled' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={18} />
          {t('adminDashboard.cancelled')} ({repairs.filter(r => r.status === 'cancelled').length})
        </button>
      </div>

      {filteredRepairs.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>{t('adminDashboard.noRepairs')}</h3>
          <p>{t('adminDashboard.noRepairsDescription')}</p>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRepairs.map((repair) => (
            <RepairRequestCard
              key={repair.id}
              request={repair}
              isExpanded={expandedDescriptions[repair.id!] || false}
              onToggleDescription={toggleDescription}
              truncateText={truncateText}
              showSubmitterInfo={true}
              showFollowUpActions={true}
              showAdminActions={true}
              followUpAction={followUpAction[repair.id!]}
              onFollowUpActionChange={(value) => setFollowUpAction({ ...followUpAction, [repair.id!]: value })}
              onAddFollowUpAction={() => handleAddFollowUpAction(repair.id!)}
              onMarkAsCompleted={() => handleMarkAsCompleted(repair.id!)}
              onMarkAsPending={() => handleMarkAsPending(repair.id!)}
              onCancelRepair={() => handleCancelRepair(repair.id!)}
              onImageClick={setSelectedRepair}
            />
          ))}
        </div>
      )}

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

      <ActionReasonModal
        isOpen={actionModal.type === 'complete'}
        title={t('adminDashboard.actionModal.completeTitle')}
        message={t('adminDashboard.actionModal.completeMessage')}
        reasonLabel={t('adminDashboard.actionModal.reasonLabel')}
        reasonPlaceholder={t('adminDashboard.actionModal.completePlaceholder')}
        confirmText={t('adminDashboard.markAsCompleted')}
        cancelText={t('adminDashboard.exportModal.cancel')}
        onConfirm={confirmMarkAsCompleted}
        onCancel={() => setActionModal({ type: null, repairId: null })}
        variant="success"
      />

      <ActionReasonModal
        isOpen={actionModal.type === 'cancel'}
        title={t('adminDashboard.actionModal.cancelTitle')}
        message={t('adminDashboard.actionModal.cancelMessage')}
        reasonLabel={t('adminDashboard.actionModal.reasonLabel')}
        reasonPlaceholder={t('adminDashboard.actionModal.cancelPlaceholder')}
        confirmText={t('adminDashboard.cancelRequest')}
        cancelText={t('adminDashboard.exportModal.cancel')}
        onConfirm={confirmCancelRepair}
        onCancel={() => setActionModal({ type: null, repairId: null })}
        variant="danger"
      />
    </div>
  );
}
