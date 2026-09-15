import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {} as any;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDb1TyxHb7JV6cDlDv8OqEsA03LVsftdzY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "tag-in-der-praxis-kahla.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "tag-in-der-praxis-kahla",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "tag-in-der-praxis-kahla.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "77639235687",
  appId: env.VITE_FIREBASE_APP_ID || "1:77639235687:web:83695a871c6ccb0b3dfcc2"
};

// Initialize Firebase safely (avoid duplicate app initialization)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
