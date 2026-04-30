import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Modern Firestore initialization
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
// Set browser local persistence so students stay logged in across sessions
setPersistence(auth, browserLocalPersistence);

// Initialize Storage
export const storage = getStorage(app);
