import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { PortalUser, RepairRequest } from '../../types';
import { Clock, CheckCircle, XCircle, FileText, Search, Grid, Table as TableIcon, Plus } from 'lucide-react';
import RepairRequestCard from '../../components/RepairRequestCard';
import RepairForm from '../../components/User/RepairForm';
import SubmissionSuccess from '../../components/User/SubmissionSuccess';
import { format } from 'date-fns';

interface MyRequestsPageProps {
  user: PortalUser;
}

export default function MyRequestsPage({ user }: MyRequestsPageProps) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'cancelled'>('pending');
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status' | 'orderNumber' | 'location'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTableRequest, setSelectedTableRequest] = useState<RepairRequest | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    console.log('MyRequestsPage - user.uid:', user.uid);
    console.log('MyRequestsPage - user object:', user);
    
    if (!user.uid) {
      console.error('User UID is missing!');
      setError('User information is incomplete. Please try logging in again.');
      return;
    }

    const q = query(
      collection(db, 'repairs'),
      where('submitterUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    console.log('Setting up Firestore listener for repairs...');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Firestore snapshot received, size:', snapshot.size);
      const requestsData: RepairRequest[] = [];
      snapshot.forEach((doc) => {
        console.log('Repair doc:', doc.id, doc.data());
        requestsData.push({ id: doc.id, ...doc.data() } as RepairRequest);
      });
      setRequests(requestsData);
      setError(null);
    }, (error) => {
      console.error('Error fetching requests:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition') {
        setError('Database index is being created. This is a one-time setup that takes 1-2 minutes. Please refresh the page in a moment.');
      } else if (error.code === 'permission-denied') {
        setError('You do not have permission to view repair requests. Please contact your administrator.');
      } else {
        setError('Failed to load repair requests. Please try refreshing the page.');
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  const toggleDescription = (requestId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredRequests = requests.filter((req) => {
    // Filter by status
    const statusMatch = req.status === filter;
    
    // Filter by search query
    if (!searchQuery.trim()) return statusMatch;
    
    const query = searchQuery.toLowerCase();
    const searchableFields = [
      req.orderNumber?.toLowerCase() || '',
      req.description?.toLowerCase() || '',
      req.location?.toLowerCase() || '',
      req.followUpActions?.join(' ').toLowerCase() || '',
      req.completionReason?.toLowerCase() || '',
      req.cancellationReason?.toLowerCase() || ''
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

  const sortedRequests = [...filteredRequests].sort((a, b) => {
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
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSubmissionSuccess = (orderNumber: string) => {
    setSubmittedOrderNumber(orderNumber);
  };

  const handleCloseModal = () => {
    setShowSubmitModal(false);
    setSubmittedOrderNumber(null);
  };

  return (
    <div className="my-requests-page">
      {/* Mobile Header */}
      <div className="page-header-mobile">
        <h1>{t('myRequests.title')}</h1>
        <button 
          className="search-toggle-btn"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Toggle search"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Desktop Header */}
      <div className="page-header-desktop">
        <h1>{t('myRequests.title')}</h1>
        <button
          className="btn-primary"
          onClick={() => setShowSubmitModal(true)}
        >
          <Plus size={20} />
          Submit Request
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <XCircle size={20} />
          <div>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Mobile Search */}
      {showSearch && (
        <div className="search-box-mobile">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t('myRequests.searchPlaceholder')}
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
            placeholder={t('myRequests.searchPlaceholder')}
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
          {t('adminDashboard.pending')}
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={18} />
          {t('adminDashboard.completed')}
        </button>
        <button
          className={filter === 'cancelled' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={18} />
          {t('adminDashboard.cancelled')}
        </button>
      </div>

      {sortedRequests.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>{t('myRequests.noRequests')}</h3>
          <p>{t('myRequests.noRequestsDescription')}</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="requests-grid">
              {sortedRequests.map((request) => (
                <RepairRequestCard
                  key={request.id}
                  request={request}
                  isExpanded={expandedDescriptions[request.id!] || false}
                  onToggleDescription={toggleDescription}
                  truncateText={truncateText}
                  showSubmitterInfo={false}
                  showFollowUpActions={false}
                  showAdminActions={false}
                  onImageClick={(req, imageIndex) => window.open(req.imageUrls[imageIndex], '_blank')}
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
                <th onClick={() => handleSort('location')} className="sortable">
                  {t('repairForm.location')} {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  {t('adminDashboard.submittedOn')} {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map((request) => (
                <tr key={request.id} onClick={() => setSelectedTableRequest(request)} className="clickable-row">
                  <td className="request-number">{request.orderNumber}</td>
                  <td>
                    <span className={`status-badge ${request.status}`}>
                      {request.status === 'pending' && <Clock size={14} />}
                      {request.status === 'completed' && <CheckCircle size={14} />}
                      {request.status === 'cancelled' && <XCircle size={14} />}
                    </span>
                  </td>
                  <td>{request.location}</td>
                  <td>{format(request.createdAt.toDate(), 'MMM dd, yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}

      {selectedTableRequest && (
        <div className="modal-overlay" onClick={() => setSelectedTableRequest(null)}>
          <div className="modal-content modal-card-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedTableRequest(null)}
            >
              ×
            </button>
            <RepairRequestCard
              request={selectedTableRequest}
              isExpanded={true}
              onToggleDescription={() => {}}
              truncateText={truncateText}
              showSubmitterInfo={false}
              showFollowUpActions={false}
              showAdminActions={false}
              onImageClick={() => {}}
            />
          </div>
        </div>
      )}
      
      {/* Mobile Floating Plus Button */}
      <button
        className="floating-add-button-mobile"
        onClick={() => setShowSubmitModal(true)}
        aria-label="Submit new request"
      >
        <Plus size={24} />
      </button>

      {/* Submit Request Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-form-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={handleCloseModal}
            >
              ×
            </button>
            {submittedOrderNumber ? (
              <SubmissionSuccess
                orderNumber={submittedOrderNumber}
              />
            ) : (
              <RepairForm 
                user={user} 
                onSuccess={handleSubmissionSuccess}
                onCancel={handleCloseModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
