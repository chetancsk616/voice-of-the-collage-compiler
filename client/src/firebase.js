import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// Replace these values with your actual Firebase project config
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBcDSyVg1tvYqHJteOUyE8r7cb5swSTnVg',
  authDomain: 'aicompiler-45c59.firebaseapp.com',
  databaseURL:
    'https://aicompiler-45c59-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'aicompiler-45c59',
  storageBucket: 'aicompiler-45c59.firebasestorage.app',
  messagingSenderId: '334749977360',
  appId: '1:334749977360:web:6a693a232e993ae87fb395',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (optional, only in production)
let analytics = null;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics not available:', error);
  }
}

export { analytics };
export default app;
