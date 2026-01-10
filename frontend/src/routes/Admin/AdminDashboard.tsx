import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Download, FileText, Search, Grid, Table as TableIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { RepairRequest } from '../../types';
import RepairRequestCard from '../../components/RepairRequestCard';
import ImageWithLoading from '../../components/ImageWithLoading';
import ActionReasonModal from '../../components/Admin/RequestDashboard/ActionReasonModal';
import ExportModal from '../../components/Admin/RequestDashboard/ExportModal';
import RepairsTable from '../../components/Admin/RequestDashboard/RepairsTable';
import { useRepairCounts } from '../../hooks/useRepairCounts';
import { useRepairs } from '../../hooks/useRepairs';
import { useRepairActions } from '../../hooks/useRepairActions';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'pending' | 'completed' | 'cancelled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status' | 'orderNumber' | 'location' | 'submitterName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRepair, setSelectedRepair] = useState<{ repair: RepairRequest; imageIndex: number } | null>(null);
  const [selectedTableRepair, setSelectedTableRepair] = useState<RepairRequest | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [showExportModal, setShowExportModal] = useState(false);

  // Custom hooks
  const { pendingCount, completedCount, cancelledCount, updateCounts } = useRepairCounts();
  const { repairs, hasMore, isLoadingMore, loadMore } = useRepairs(filter, searchQuery);
  const {
    actionModal,
    followUpAction,
    setActionModal,
    setFollowUpAction,
    handleMarkAsCompleted,
    confirmMarkAsCompleted,
    handleCancelRepair,
    confirmCancelRepair,
    handleAddFollowUpAction
  } = useRepairActions(updateCounts);

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

  const handleNextImage = () => {
    if (!selectedRepair) return;
    const nextIndex = (selectedRepair.imageIndex + 1) % selectedRepair.repair.imageUrls.length;
    setSelectedRepair({ ...selectedRepair, imageIndex: nextIndex });
  };

  const handlePrevImage = () => {
    if (!selectedRepair) return;
    const prevIndex = selectedRepair.imageIndex === 0
      ? selectedRepair.repair.imageUrls.length - 1
      : selectedRepair.imageIndex - 1;
    setSelectedRepair({ ...selectedRepair, imageIndex: prevIndex });
  };

  const filteredRepairs = repairs.filter(repair => {
    if (!searchQuery.trim()) return true;
    
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
    
    return searchableFields.some(field => field.includes(query));
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
      {/* Mobile Header */}
      <div className="page-header-mobile">
        <h1>{t('adminDashboard.title')}</h1>
        <button
          className="search-toggle-btn"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Toggle search"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Desktop Header */}
      <div className="dashboard-header">
        <div>
          <h1>{t('adminDashboard.title')}</h1>
        </div>
        <button onClick={() => setShowExportModal(true)} className="btn-secondary">
          <Download size={18} />
          {t('adminDashboard.exportCSV')}
        </button>
      </div>

      {/* Mobile Search */}
      {showSearch && (
        <div className="search-box-mobile">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t('adminDashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
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
      )}

      {/* Desktop Search and View Controls */}
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

      {/* Mobile Filter Tabs */}
      <div className="filter-tabs-mobile">
        <button
          className={filter === 'pending' ? 'filter-tab-simple active' : 'filter-tab-simple'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={16} />
          {t('adminDashboard.pending')}
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab-simple active' : 'filter-tab-simple'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={16} />
          {t('adminDashboard.completed')}
        </button>
        <button
          className={filter === 'cancelled' ? 'filter-tab-simple active' : 'filter-tab-simple'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={16} />
          {t('adminDashboard.cancelled')}
        </button>
      </div>

      {/* Desktop Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={filter === 'pending' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={18} />
          {t('adminDashboard.pending')} ({pendingCount})
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={18} />
          {t('adminDashboard.completed')} ({completedCount})
        </button>
        <button
          className={filter === 'cancelled' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={18} />
          {t('adminDashboard.cancelled')} ({cancelledCount})
        </button>
      </div>

      {sortedRepairs.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>{t('adminDashboard.noRepairs')}</h3>
          <p>{t('adminDashboard.noRepairsDescription')}</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
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
                  onAddFollowUpAction={() => handleAddFollowUpAction(repair.id!, repairs)}
                  onMarkAsCompleted={() => handleMarkAsCompleted(repair.id!)}
                  onCancelRepair={() => handleCancelRepair(repair.id!)}
                  onImageClick={(repair, imageIndex) => setSelectedRepair({ repair, imageIndex })}
                />
              ))}
            </div>
          ) : (
            <RepairsTable
              repairs={sortedRepairs}
              filter={filter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onRowClick={setSelectedTableRepair}
              onMarkAsCompleted={handleMarkAsCompleted}
              onCancelRepair={handleCancelRepair}
            />
          )}
          
          {hasMore && (
            <div className="load-more-container">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="btn-secondary load-more-btn"
              >
                {isLoadingMore ? t('common.loading') || 'Loading...' : t('common.loadMore') || 'Load More'}
              </button>
              <p className="load-more-info">
                {t('common.showing') || 'Showing'} {repairs.length} {t('common.requests') || 'requests'}
              </p>
            </div>
          )}
        </>
      )}

      {selectedRepair && (
        <div className="modal-overlay" onClick={() => setSelectedRepair(null)}>
          <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRepair(null)}>
              ×
            </button>
            <h2>{selectedRepair.repair.orderNumber}</h2>
            <div className="modal-images">
              <ImageWithLoading
                src={selectedRepair.repair.imageUrls[selectedRepair.imageIndex]}
                alt={`Repair ${selectedRepair.imageIndex + 1}`}
                className="full-image"
              />
              {selectedRepair.repair.imageUrls.length > 1 && (
                <>
                  <button
                    className="image-nav-btn prev"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    className="image-nav-btn next"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight size={32} />
                  </button>
                  <div className="image-counter">
                    {selectedRepair.imageIndex + 1} / {selectedRepair.repair.imageUrls.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        repairs={repairs}
      />

      {selectedTableRepair && (
        <div className="modal-overlay" onClick={() => setSelectedTableRepair(null)}>
          <div className="modal-content modal-card-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTableRepair(null)}>
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
              onAddFollowUpAction={() => handleAddFollowUpAction(selectedTableRepair.id!, repairs)}
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
