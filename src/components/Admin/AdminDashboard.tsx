import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { RepairRequest } from '../../types';
import { Clock, CheckCircle, XCircle, List, Download, FileText, Search, Grid, Table as TableIcon } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status' | 'orderNumber' | 'location' | 'submitterName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTableRepair, setSelectedTableRepair] = useState<RepairRequest | null>(null);

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
    // Filter by status
    const statusMatch = filter === 'all' || repair.status === filter;
    
    // Filter by search query
    if (!searchQuery.trim()) return statusMatch;
    
    const query = searchQuery.toLowerCase();
    const searchableFields = [
      repair.orderNumber?.toLowerCase() || '',
      repair.description?.toLowerCase() || '',
      repair.location?.toLowerCase() || '',
      repair.submitterName?.toLowerCase() || '',
      repair.followUpActions?.join(' ').toLowerCase() || '',
      repair.completionReason?.toLowerCase() || '',
      repair.cancellationReason?.toLowerCase() || ''
    ];
    
    const searchMatch = searchableFields.some(field => field.includes(query));
    
    return statusMatch && searchMatch;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedRepairs = [...filteredRepairs].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'createdAt':
        aValue = a.createdAt.toDate().getTime();
        bValue = b.createdAt.toDate().getTime();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'orderNumber':
        aValue = a.orderNumber;
        bValue = b.orderNumber;
        break;
      case 'location':
        aValue = a.location;
        bValue = b.location;
        break;
      case 'submitterName':
        aValue = a.submitterName || '';
        bValue = b.submitterName || '';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="my-requests-page admin-dashboard">
      <div className="page-header">
        <div>
          <h1>{t('adminDashboard.title')}</h1>
        </div>
        <button onClick={() => setShowExportModal(true)} className="btn-secondary">
          <Download size={18} />
          {t('adminDashboard.exportCSV')}
        </button>
      </div>

      <div className="search-and-view-controls">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder={t('adminDashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'view-btn active' : 'view-btn'}
            onClick={() => setViewMode('grid')}
            title={t('adminDashboard.gridView')}
          >
            <Grid size={18} />
          </button>
          <button
            className={viewMode === 'table' ? 'view-btn active' : 'view-btn'}
            onClick={() => setViewMode('table')}
            title={t('adminDashboard.tableView')}
          >
            <TableIcon size={18} />
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('all')}
        >
          <List size={18} />
          {t('adminDashboard.all')} ({filteredRepairs.length})
        </button>
        <button
          className={filter === 'pending' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={18} />
          {t('adminDashboard.pending')} ({repairs.filter(r => {
            if (!searchQuery.trim()) return r.status === 'pending';
            const query = searchQuery.toLowerCase();
            const searchableFields = [
              r.orderNumber?.toLowerCase() || '',
              r.description?.toLowerCase() || '',
              r.location?.toLowerCase() || '',
              r.submitterName?.toLowerCase() || '',
              r.followUpActions?.join(' ').toLowerCase() || '',
              r.completionReason?.toLowerCase() || '',
              r.cancellationReason?.toLowerCase() || ''
            ];
            return r.status === 'pending' && searchableFields.some(field => field.includes(query));
          }).length})
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={18} />
          {t('adminDashboard.completed')} ({repairs.filter(r => {
            if (!searchQuery.trim()) return r.status === 'completed';
            const query = searchQuery.toLowerCase();
            const searchableFields = [
              r.orderNumber?.toLowerCase() || '',
              r.description?.toLowerCase() || '',
              r.location?.toLowerCase() || '',
              r.submitterName?.toLowerCase() || '',
              r.followUpActions?.join(' ').toLowerCase() || '',
              r.completionReason?.toLowerCase() || '',
              r.cancellationReason?.toLowerCase() || ''
            ];
            return r.status === 'completed' && searchableFields.some(field => field.includes(query));
          }).length})
        </button>
        <button
          className={filter === 'cancelled' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={18} />
          {t('adminDashboard.cancelled')} ({repairs.filter(r => {
            if (!searchQuery.trim()) return r.status === 'cancelled';
            const query = searchQuery.toLowerCase();
            const searchableFields = [
              r.orderNumber?.toLowerCase() || '',
              r.description?.toLowerCase() || '',
              r.location?.toLowerCase() || '',
              r.submitterName?.toLowerCase() || '',
              r.followUpActions?.join(' ').toLowerCase() || '',
              r.completionReason?.toLowerCase() || '',
              r.cancellationReason?.toLowerCase() || ''
            ];
            return r.status === 'cancelled' && searchableFields.some(field => field.includes(query));
          }).length})
        </button>
      </div>

      {sortedRepairs.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>{t('adminDashboard.noRepairs')}</h3>
          <p>{t('adminDashboard.noRepairsDescription')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="requests-grid">
          {sortedRepairs.map((repair) => (
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
              onCancelRepair={() => handleCancelRepair(repair.id!)}
              onImageClick={setSelectedRepair}
            />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('orderNumber')} className="sortable">
                  {t('adminDashboard.requestNumber')} {sortBy === 'orderNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  {t('adminDashboard.status')} {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('submitterName')} className="sortable">
                  {t('adminDashboard.submittedBy')} {sortBy === 'submitterName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('location')} className="sortable">
                  {t('repairForm.location')} {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  {t('adminDashboard.submittedOn')} {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                {filter === 'pending' && <th>{t('adminDashboard.actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {sortedRepairs.map((repair) => (
                <tr key={repair.id} onClick={() => setSelectedTableRepair(repair)} className="clickable-row">
                  <td className="request-number">{repair.orderNumber}</td>
                  <td>
                    <span className={`status-badge ${repair.status}`}>
                      {repair.status === 'pending' && <Clock size={14} />}
                      {repair.status === 'completed' && <CheckCircle size={14} />}
                      {repair.status === 'cancelled' && <XCircle size={14} />}
                    </span>
                  </td>
                  <td>{repair.submitterName}</td>
                  <td>{repair.location}</td>
                  <td>{format(repair.createdAt.toDate(), 'MMM dd, yyyy HH:mm')}</td>
                  {filter === 'pending' && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="table-actions">
                        <button
                          onClick={() => handleMarkAsCompleted(repair.id!)}
                          className="btn-table btn-success-outline"
                          title={t('adminDashboard.markAsCompleted')}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleCancelRepair(repair.id!)}
                          className="btn-table btn-danger-outline"
                          title={t('adminDashboard.cancelRequest')}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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

      {selectedTableRepair && (
        <div className="modal-overlay" onClick={() => setSelectedTableRepair(null)}>
          <div className="modal-content modal-card-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedTableRepair(null)}
            >
              ×
            </button>
            <RepairRequestCard
              request={selectedTableRepair}
              isExpanded={true}
              onToggleDescription={() => {}}
              truncateText={truncateText}
              showSubmitterInfo={true}
              showFollowUpActions={true}
              showAdminActions={true}
              followUpAction={followUpAction[selectedTableRepair.id!]}
              onFollowUpActionChange={(value) => setFollowUpAction({ ...followUpAction, [selectedTableRepair.id!]: value })}
              onAddFollowUpAction={() => handleAddFollowUpAction(selectedTableRepair.id!)}
              onMarkAsCompleted={() => {
                handleMarkAsCompleted(selectedTableRepair.id!);
                setSelectedTableRepair(null);
              }}
              onCancelRepair={() => {
                handleCancelRepair(selectedTableRepair.id!);
                setSelectedTableRepair(null);
              }}
              onImageClick={() => {}}
            />
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
