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
  followUpActions?: string[];
}

export interface User {
  uid: string;
  email: string | null;
}
