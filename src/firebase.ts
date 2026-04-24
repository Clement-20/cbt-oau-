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

// --- CORS WORKAROUND FOR AI STUDIO BUCKETS ---
// This intercepts any request Firebase Storage tries to make and routes it
// through our Express proxy to cleanly bypass browser CORS restrictions.
if (typeof window !== "undefined") {
  // Try to safely redefine fetch to get around property assignment restrictions
  try {
    const originalFetch = window.fetch;
    Object.defineProperty(window, "fetch", {
      value: async function () {
        let args = Array.from(arguments) as [RequestInfo | URL, RequestInit?];
        let resource = args[0];
        if (typeof resource === 'string' && resource.startsWith('https://firebasestorage.googleapis.com')) {
          args[0] = resource.replace('https://firebasestorage.googleapis.com', '/proxy-storage');
        }
        return originalFetch.apply(this, args as any);
      },
      configurable: true,
      writable: true
    });
  } catch (e) {
    console.warn("Could not patch window.fetch for CORS workaround", e);
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
    if (typeof url === 'string' && url.startsWith('https://firebasestorage.googleapis.com')) {
      url = url.replace('https://firebasestorage.googleapis.com', '/proxy-storage');
    }
    return originalOpen.apply(this, arguments as any);
  };
}
// ---------------------------------------------

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
