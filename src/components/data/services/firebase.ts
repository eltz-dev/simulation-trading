import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  push,
  serverTimestamp 
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyBIQLnPYLE3ohNbK1t4wCR-diJIxlJ02_Q",
  authDomain: "trading-sim-9bd9e.firebaseapp.com",
  databaseURL: "https://trading-sim-9bd9e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "trading-sim-9bd9e",
  storageBucket: "trading-sim-9bd9e.firebasestorage.app",
  messagingSenderId: "693746985598",
  appId: "1:693746985598:web:5c5657e8b66933cf0a462f",
  measurementId: "G-1G0H2SF0J6"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

export type { User };
