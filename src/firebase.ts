import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDeG9gA31lyCga3GCy52sUsudzY8dDu27I",
  authDomain: "repair-portal-d9b17.firebaseapp.com",
  projectId: "repair-portal-d9b17",
  storageBucket: "repair-portal-d9b17.firebasestorage.app",
  messagingSenderId: "67457919532",
  appId: "1:67457919532:web:d59c7a54ed1a8736347f89",
  measurementId: "G-24V5VJQPRB"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
