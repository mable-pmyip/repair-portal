import { Timestamp } from 'firebase/firestore';

export interface RepairRequest {
  id?: string;
  orderNumber: string;
  description: string;
  location: string;
  imageUrls: string[];
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
  submitterName?: string;
  submitterEmail?: string;
  submitterUid?: string;
  followUpActions?: string[];
  completionReason?: string;
  cancellationReason?: string;
}

export interface User {
  uid: string;
  email: string | null;
}

export interface PortalUser {
  id?: string;
  uid: string;
  email: string;
  username: string;
  department: string;
  isFirstLogin: boolean;
  createdAt: Timestamp;
  createdBy: string;
  lastLogin?: Timestamp;
}

export const DEFAULT_PASSWORD = 'TempPass123!';
