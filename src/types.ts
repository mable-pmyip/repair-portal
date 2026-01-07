import { Timestamp } from 'firebase/firestore';

export interface RepairRequest {
  id?: string;
  orderNumber: string;
  description: string;
  imageUrls: string[];
  status: 'pending' | 'completed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  submitterName?: string;
  submitterEmail?: string;
}

export interface User {
  uid: string;
  email: string | null;
}
