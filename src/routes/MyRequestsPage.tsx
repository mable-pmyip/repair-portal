import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { PortalUser, RepairRequest } from '../types';
import { Clock, CheckCircle, XCircle, List, FileText } from 'lucide-react';
import RepairRequestCard from '../components/RepairRequestCard';

interface MyRequestsPageProps {
  user: PortalUser;
}

export default function MyRequestsPage({ user }: MyRequestsPageProps) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

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
    if (filter === 'all') return true;
    return req.status === filter;
  });

  return (
    <div className="my-requests-page">
      <div className="page-header">
        <h1>{t('myRequests.title')}</h1>
        <p>{t('myRequests.subtitle')}</p>
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

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('all')}
        >
          <List size={18} />
          {t('adminDashboard.all')} ({requests.length})
        </button>
        <button
          className={filter === 'pending' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={18} />
          {t('adminDashboard.pending')} ({requests.filter((r) => r.status === 'pending').length})
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={18} />
          {t('adminDashboard.completed')} ({requests.filter((r) => r.status === 'completed').length})
        </button>
        <button
          className={filter === 'cancelled' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={18} />
          {t('adminDashboard.cancelled')} ({requests.filter((r) => r.status === 'cancelled').length})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>{t('myRequests.noRequests')}</h3>
          <p>{t('myRequests.noRequestsDescription')}</p>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((request) => (
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
      )}
    </div>
  );
}
