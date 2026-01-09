import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { RepairRequest } from '../types';

const PAGE_SIZE = 100;

/**
 * Custom hook to fetch and manage repair requests with pagination and search.
 * 
 * This hook:
 * - Fetches repairs filtered by status (pending/completed/cancelled)
 * - Implements pagination to load 100 repairs at a time for performance
 * - When searching, fetches ALL repairs (removes limit) to search across entire dataset
 * - Uses real-time updates (onSnapshot) so data stays fresh
 * - Provides a loadMore() function for pagination
 * 
 * @param filter - The status to filter by ('pending' | 'completed' | 'cancelled')
 * @param searchQuery - Search text to filter results (when provided, fetches all data)
 * 
 * @returns Object containing:
 *   - repairs: Array of RepairRequest objects
 *   - hasMore: Boolean indicating if more pages are available
 *   - isLoadingMore: Boolean indicating if currently loading next page
 *   - loadMore: Function to fetch the next batch of repairs
 * 
 * @example
 * const { repairs, hasMore, isLoadingMore, loadMore } = useRepairs('pending', searchQuery);
 * // repairs updates automatically when data changes in Firestore
 * // Call loadMore() to fetch next 100 items
 */
export function useRepairs(filter: 'pending' | 'completed' | 'cancelled', searchQuery: string) {
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // When searching, fetch all documents (no limit) to search across all data
    // When not searching, use pagination with limit
    const q = searchQuery.trim()
      ? query(
          collection(db, 'repairs'),
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, 'repairs'),
          where('status', '==', filter),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repairData: RepairRequest[] = [];
      snapshot.forEach((doc) => {
        repairData.push({ id: doc.id, ...doc.data() } as RepairRequest);
      });
      setRepairs(repairData);
      
      // Update pagination state (only relevant when not searching)
      if (!searchQuery.trim()) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisible(lastDoc || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        // When searching, disable pagination
        setLastVisible(null);
        setHasMore(false);
      }
    });

    return () => unsubscribe();
  }, [filter, searchQuery]);

  const loadMore = async () => {
    if (!lastVisible || !hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const q = query(
        collection(db, 'repairs'),
        where('status', '==', filter),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      
      const snapshot = await getDocs(q);
      const newRepairs: RepairRequest[] = [];
      snapshot.forEach((doc) => {
        newRepairs.push({ id: doc.id, ...doc.data() } as RepairRequest);
      });
      
      setRepairs(prev => [...prev, ...newRepairs]);
      
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more repairs:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    repairs,
    hasMore,
    isLoadingMore,
    loadMore
  };
}
