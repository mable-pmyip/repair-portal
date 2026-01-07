import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { RepairRequest } from '../types';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
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
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'tab active' : 'tab'}
          onClick={() => setFilter('all')}
        >
          All ({repairs.length})
        </button>
        <button
          className={filter === 'pending' ? 'tab active' : 'tab'}
          onClick={() => setFilter('pending')}
        >
          Pending ({repairs.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={filter === 'completed' ? 'tab active' : 'tab'}
          onClick={() => setFilter('completed')}
        >
          Completed ({repairs.filter(r => r.status === 'completed').length})
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
                <p><strong>Email:</strong> {repair.submitterEmail}</p>
                <p><strong>Date:</strong> {format(repair.createdAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                {repair.completedAt && (
                  <p><strong>Completed:</strong> {format(repair.completedAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                )}
              </div>

              <div className="repair-description">
                <strong>Description:</strong>
                <p>{repair.description}</p>
              </div>

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
                  <button
                    onClick={() => handleMarkAsCompleted(repair.id!)}
                    className="btn-success"
                  >
                    Mark as Completed
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsPending(repair.id!)}
                    className="btn-warning"
                  >
                    Reopen
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
