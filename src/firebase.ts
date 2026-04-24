import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable Offline Persistence for 35k+ multi-user scalability and bandwidth efficiency
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore Persistence: Multiple tabs open. Persistence disabled for this tab.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore Persistence: Browser doesn't support persistence.");
    }
  });
}

export const auth = getAuth(app);

// Set browser local persistence so students stay logged in across sessions
setPersistence(auth, browserLocalPersistence);

export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// Test connection to Firestore
async function testConnection() {
  try {
    const testDoc = doc(db, '_internal_', 'connection_test');
    await getDocFromServer(testDoc);
    console.log("✅ Firestore connection verified.");
  } catch (error: any) {
    console.error("❌ Firestore Connection Error:", error.message);
    if (error.message && error.message.includes('the client is offline')) {
      console.error("CRITICAL: Client is offline or database ID is incorrect.");
    } else if (error.message && error.message.includes('permission-denied')) {
      console.error("PERMISSION DENIED: Check firestore.rules.");
    }
    // Check for potential DNS issues with custom domains
    const isCustomDomain = firebaseConfig.authDomain && !firebaseConfig.authDomain.includes('firebaseapp.com');
    
    console.group("Firebase Diagnosis");
    console.log("Project ID:", firebaseConfig.projectId);
    console.log("Database ID:", databaseId);
    console.log("Auth Domain:", firebaseConfig.authDomain);
    console.log("Current App Domain:", window.location.hostname);
    if (isCustomDomain) {
      console.warn(`⚠️ CUSTOM AUTH DOMAIN DETECTED: ${firebaseConfig.authDomain}`);
      console.warn(`👉 Ensure '${window.location.hostname}' is added to 'Authorized Domains' in Firebase Authentication Console.`);
      console.warn("👉 If you see NXDOMAIN, check that your custom domain has a CNAME record pointing to Firebase.");
    }
    console.log("API Key:", firebaseConfig.apiKey ? "PRESENT" : "MISSING");
    console.groupEnd();
  }
}

testConnection();
