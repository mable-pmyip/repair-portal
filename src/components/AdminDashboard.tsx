import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { RepairRequest } from '../types';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, List } from 'lucide-react';

export default function AdminDashboard() {
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [followUpAction, setFollowUpAction] = useState<{ [key: string]: string }>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

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

  const filteredRepairs = repairs.filter(repair => {
    if (filter === 'all') return true;
    return repair.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading repairs...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Repair Requests Dashboard</h1>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'tab active' : 'tab'}
          onClick={() => setFilter('all')}
        >
          <List size={18} />
          All ({repairs.length})
        </button>
        <button
          className={filter === 'pending' ? 'tab active' : 'tab'}
          onClick={() => setFilter('pending')}
        >
          <Clock size={18} />
          Pending ({repairs.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={filter === 'completed' ? 'tab active' : 'tab'}
          onClick={() => setFilter('completed')}
        >
          <CheckCircle size={18} />
          Completed ({repairs.filter(r => r.status === 'completed').length})
        </button>
        <button
          className={filter === 'cancelled' ? 'tab active' : 'tab'}
          onClick={() => setFilter('cancelled')}
        >
          <XCircle size={18} />
          Cancelled ({repairs.filter(r => r.status === 'cancelled').length})
        </button>
      </div>

      <div className="repairs-grid">
        {filteredRepairs.length === 0 ? (
          <p className="no-repairs">No repair requests found.</p>
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
                <p><strong>Submitted by:</strong> {repair.submitterName}</p>
                <p><strong>Location:</strong> {repair.location}</p>
                <p><strong>Date:</strong> {format(repair.createdAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                {repair.completedAt && (
                  <p><strong>Completed:</strong> {format(repair.completedAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                )}
                {repair.cancelledAt && (
                  <p><strong>Cancelled:</strong> {format(repair.cancelledAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                )}
              </div>

              <div className="repair-description">
                <strong>Description:</strong>
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
                    {expandedDescriptions[repair.id!] ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {repair.followUpActions && repair.followUpActions.length > 0 && (
                <div className="follow-up-actions">
                  <strong>Follow-up Actions:</strong>
                  <ul>
                    {repair.followUpActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {repair.imageUrls.length > 0 && (
                <div className="repair-images">
                  <strong>Images:</strong>
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
                        placeholder="Add follow-up action..."
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
                        Add Action
                      </button>
                    </div>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleMarkAsCompleted(repair.id!)}
                        className="btn-success"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => handleCancelRepair(repair.id!)}
                        className="btn-danger"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </>
                ) : repair.status === 'completed' ? (
                  <button
                    onClick={() => handleMarkAsPending(repair.id!)}
                    className="btn-warning"
                  >
                    Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsPending(repair.id!)}
                    className="btn-warning"
                  >
                    Restore to Pending
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
    </div>
  );
}
