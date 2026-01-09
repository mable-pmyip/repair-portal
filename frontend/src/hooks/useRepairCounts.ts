import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook to manage and track repair request counts for each status.
 * 
 * This hook:
 * - Fetches the count of pending, completed, and cancelled repairs on mount
 * - Uses Firestore's getCountFromServer() for efficient counting (doesn't fetch actual documents)
 * - Provides an updateCounts() function to manually adjust counts when status changes
 * 
 * @returns Object containing:
 *   - pendingCount: Number of pending repairs
 *   - completedCount: Number of completed repairs  
 *   - cancelledCount: Number of cancelled repairs
 *   - updateCounts: Function to update counts when a repair's status changes
 * 
 * @example
 * const { pendingCount, completedCount, cancelledCount, updateCounts } = useRepairCounts();
 * // When marking a repair as completed:
 * updateCounts('pending', 'completed'); // Decrements pending, increments completed
 */
export function useRepairCounts() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [cancelledCount, setCancelledCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const pendingQuery = query(collection(db, 'repairs'), where('status', '==', 'pending'));
        const completedQuery = query(collection(db, 'repairs'), where('status', '==', 'completed'));
        const cancelledQuery = query(collection(db, 'repairs'), where('status', '==', 'cancelled'));

        const [pendingSnapshot, completedSnapshot, cancelledSnapshot] = await Promise.all([
          getCountFromServer(pendingQuery),
          getCountFromServer(completedQuery),
          getCountFromServer(cancelledQuery)
        ]);

        setPendingCount(pendingSnapshot.data().count);
        setCompletedCount(completedSnapshot.data().count);
        setCancelledCount(cancelledSnapshot.data().count);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, []);

  const updateCounts = (fromStatus: 'pending' | 'completed' | 'cancelled', toStatus: 'pending' | 'completed' | 'cancelled') => {
    if (fromStatus === 'pending') setPendingCount(prev => Math.max(0, prev - 1));
    if (fromStatus === 'completed') setCompletedCount(prev => Math.max(0, prev - 1));
    if (fromStatus === 'cancelled') setCancelledCount(prev => Math.max(0, prev - 1));
    
    if (toStatus === 'pending') setPendingCount(prev => prev + 1);
    if (toStatus === 'completed') setCompletedCount(prev => prev + 1);
    if (toStatus === 'cancelled') setCancelledCount(prev => prev + 1);
  };

  return {
    pendingCount,
    completedCount,
    cancelledCount,
    updateCounts
  };
}
