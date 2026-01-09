import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { RepairRequest } from '../types';

/**
 * Custom hook to manage repair request actions (complete, cancel, add follow-up).
 * 
 * This hook:
 * - Handles marking repairs as completed or cancelled
 * - Manages the modal state for action confirmations
 * - Updates repair documents in Firestore
 * - Calls onStatusChange callback to update local counts
 * - Manages follow-up action text inputs for each repair
 * 
 * @param onStatusChange - Callback function to update counts when status changes
 *                         Called with (fromStatus, toStatus) to adjust counters
 * 
 * @returns Object containing:
 *   - actionModal: Current modal state (type: 'complete'|'cancel'|null, repairId)
 *   - followUpAction: Object mapping repairId to follow-up text input values
 *   - setActionModal: Function to control modal visibility
 *   - setFollowUpAction: Function to update follow-up text
 *   - handleMarkAsCompleted: Opens completion modal for a repair
 *   - confirmMarkAsCompleted: Executes the completion (updates Firestore)
 *   - handleCancelRepair: Opens cancellation modal for a repair  
 *   - confirmCancelRepair: Executes the cancellation (updates Firestore)
 *   - handleAddFollowUpAction: Adds a follow-up action note to a repair
 * 
 * @example
 * const { 
 *   handleMarkAsCompleted, 
 *   confirmMarkAsCompleted,
 *   actionModal 
 * } = useRepairActions((from, to) => {
 *   // Update counts when status changes
 *   updateCounts(from, to);
 * });
 * // Call handleMarkAsCompleted(repairId) to open modal
 * // Call confirmMarkAsCompleted(reason) to actually complete the repair
 */
export function useRepairActions(onStatusChange: (fromStatus: 'pending', toStatus: 'completed' | 'cancelled') => void) {
  const [actionModal, setActionModal] = useState<{ type: 'complete' | 'cancel' | null; repairId: string | null }>({ 
    type: null, 
    repairId: null 
  });
  const [followUpAction, setFollowUpAction] = useState<{ [key: string]: string }>({});

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
      onStatusChange('pending', 'completed');
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
      onStatusChange('pending', 'cancelled');
    } catch (error) {
      console.error('Error cancelling repair:', error);
    }
  };

  const handleAddFollowUpAction = async (repairId: string, repairs: RepairRequest[]) => {
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

  return {
    actionModal,
    followUpAction,
    setActionModal,
    setFollowUpAction,
    handleMarkAsCompleted,
    confirmMarkAsCompleted,
    handleCancelRepair,
    confirmCancelRepair,
    handleAddFollowUpAction
  };
}
