import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { PortalUser, RepairRequest } from '../types';
import { Clock, CheckCircle, XCircle, List, FileText, Search, Grid, Table as TableIcon } from 'lucide-react';
import RepairRequestCard from '../components/RepairRequestCard';
import { format } from 'date-fns';

interface MyRequestsPageProps {
  user: PortalUser;
}

export default function MyRequestsPage({ user }: MyRequestsPageProps) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status' | 'orderNumber' | 'location'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTableRequest, setSelectedTableRequest] = useState<RepairRequest | null>(null);

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
    const statusMatch = filter === 'all' || req.status === filter;
    
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

  return (
    <div className="my-requests-page">
      <div className="page-header">
        <h1>{t('myRequests.title')}</h1>
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

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('all')}
        >
          <List size={18} />
          {t('adminDashboard.all')} ({filteredRequests.length})
        </button>
        <button
          className={filter === 'pending' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={18} />
          {t('adminDashboard.pending')} ({requests.filter(r => {
            if (!searchQuery.trim()) return r.status === 'pending';
            const query = searchQuery.toLowerCase();
            const searchableFields = [
              r.orderNumber?.toLowerCase() || '',
              r.description?.toLowerCase() || '',
              r.location?.toLowerCase() || '',
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
          {t('adminDashboard.completed')} ({requests.filter(r => {
            if (!searchQuery.trim()) return r.status === 'completed';
            const query = searchQuery.toLowerCase();
            const searchableFields = [
              r.orderNumber?.toLowerCase() || '',
              r.description?.toLowerCase() || '',
              r.location?.toLowerCase() || '',
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
          {t('adminDashboard.cancelled')} ({requests.filter(r => {
            if (!searchQuery.trim()) return r.status === 'cancelled';
            const query = searchQuery.toLowerCase();
            const searchableFields = [
              r.orderNumber?.toLowerCase() || '',
              r.description?.toLowerCase() || '',
              r.location?.toLowerCase() || '',
              r.followUpActions?.join(' ').toLowerCase() || '',
              r.completionReason?.toLowerCase() || '',
              r.cancellationReason?.toLowerCase() || ''
            ];
            return r.status === 'cancelled' && searchableFields.some(field => field.includes(query));
          }).length})
        </button>
      </div>

      {sortedRequests.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>{t('myRequests.noRequests')}</h3>
          <p>{t('myRequests.noRequestsDescription')}</p>
        </div>
      ) : viewMode === 'grid' ? (
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
              onImageClick={(req) => window.open(req.imageUrls[0], '_blank')}
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
                      {t(`adminDashboard.${request.status}`)}
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
    </div>
  );
}
